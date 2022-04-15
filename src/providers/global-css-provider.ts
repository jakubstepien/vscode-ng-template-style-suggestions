import * as vscode from 'vscode';
import * as fs from 'fs';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { Observable, Subject, Subscription, switchMap, finalize, startWith } from 'rxjs';


export class GlobalCssProvider {
    private subs = new Subscription();
    private angularConfig$ = new Subject<{path: string, project: string | null}>();
    private mainStylesUris$: Observable<string[]>;
    private items: Promise<Map<string, vscode.CompletionItem>> = Promise.resolve(new Map<string, vscode.CompletionItem>());

    constructor(private configPath: string = '**/*angular.json', private projectName: string | null = null) {
        const config = {path: configPath, project: projectName};

        const watcher = vscode.workspace.createFileSystemWatcher(configPath);
        watcher.onDidChange(() => this.angularConfig$.next(config));
        this.subs.add(this.angularConfig$.pipe(finalize(() => watcher.dispose())).subscribe());

        this.mainStylesUris$ = this.angularConfig$.pipe(
            switchMap(this.getMainScssFilesUri),
            switchMap(files => {
                const subject = new Subject<string[]>();
                const watchers = files.map(x => vscode.workspace.createFileSystemWatcher('**/' + x));
                watchers.forEach(x => {
                    x.onDidChange(() => subject.next(files));
                });
                const disposeWatchers = () => {
                    watchers.forEach(w => w.dispose());
                };
                const obs = subject.pipe(startWith(files), finalize(disposeWatchers));
                return obs;
            }));
        this.subs.add(this.mainStylesUris$.subscribe(x => this.items = this.initItems(x)));

        this.angularConfig$.next(config);
    }

    getGlobalCompletitionItems() { return this.items; }

    private async initItems(stylePaths: string[]) {
        try {
            var parser = new SassFileToCompletionItemsParser();
            const paths = await Promise.all(stylePaths.map(x => vscode.workspace.findFiles(x)));
            return parser.getCompletitionItems(paths.flatMap(x => x).map(x => x.fsPath));
        }
        catch (e) {
            console.error("Error parsing items: ", e);
            return new Map<string, vscode.CompletionItem>();
        }
    }

    private async getMainScssFilesUri(angularConfig: {path: string, project: string | null}): Promise<string[]> {
        const angularJson = await vscode.workspace.findFiles(angularConfig.path);
        if (angularJson.length === 0) {
            throw new Error("Missing angular.json file, searched path: " + angularConfig.path);
        }
        if (angularJson.length > 1) {
            throw new Error("Found multiple angular.json files, searched path: " + angularConfig.path);
        }

        const config = angularJson[0];
        const json = await fs.promises.readFile(config.fsPath, { encoding: 'utf-8' });

        const configObj = JSON.parse(json);
        const projectName = angularConfig.project ?? configObj.defaultProject as string;
        return configObj.projects[projectName].architect.build.options.styles;
    }

    dispose() {
        this.angularConfig$.complete();
        this.subs.unsubscribe();
    }
}
