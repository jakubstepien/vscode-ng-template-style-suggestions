import * as vscode from 'vscode';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { Observable, Subject, Subscription, switchMap, finalize, startWith, of } from 'rxjs';
import { angularConfigProvider } from './angular-config-provider';
import { getPathsToIgnore } from '../configurationHelper';

class GlobalCssProvider {
    private static sortingPrefix: string = 'style2:';
    private subs = new Subscription();
    private mainStylesUris$: Observable<string[]> = of([]);
    private items: Promise<Map<string, vscode.CompletionItem>> = Promise.resolve(new Map<string, vscode.CompletionItem>());

    public init() {
        this.subs?.unsubscribe();
        this.subs = new Subscription();

        this.mainStylesUris$ = angularConfigProvider.config$.pipe(
            switchMap(x => {
                if (x == null) {
                    return of([]);
                }

                const files = x.styles;
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
    }

    getGlobalCompletitionItems() { return this.items; }

    private async initItems(stylePaths: string[]) {
        try {
            const pathsToIgnore = getPathsToIgnore();
            var parser = new SassFileToCompletionItemsParser();
            const items = await parser.getCompletitionItemsFromFile(stylePaths);
            items.forEach(x => x.sortText = GlobalCssProvider.sortingPrefix + x.label);
            return items;
        }
        catch (e) {
            console.error("Error parsing items: ", e);
            return new Map<string, vscode.CompletionItem>();
        }
    }

    dispose() {
        this.subs.unsubscribe();
    }
}

export const globalCssProvider = new GlobalCssProvider();