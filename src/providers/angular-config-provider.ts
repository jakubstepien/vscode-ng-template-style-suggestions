import * as vscode from 'vscode';
import * as fs from 'fs';
import { BehaviorSubject } from "rxjs";
import path = require('path');

export type AngularConfig = {
    path: string,
    project: string,
    styles: string[]
    includePaths: string[];
    nodeModulesLocation: string;
};

class AngularConfigProvider {
    private watcher: vscode.FileSystemWatcher | null = null;
    private config = new BehaviorSubject<AngularConfig | null>(null);
    public config$ = this.config.asObservable();

    get configSnapshot() {
        return this.config.value;
    }

    public async init(angularJsonPath = '**/*angular.json', project: string | null = null) {
        const loadConfig = async (path: string) => {
            const newConfig = await this.getConfig(path, project);
            this.config.next(newConfig);
        };

        const json = await this.checkIfExistsAngularJson(angularJsonPath);
        this.watcher = vscode.workspace.createFileSystemWatcher(angularJsonPath);
        this.watcher.onDidChange(async (e) => {
            await loadConfig(e.fsPath);
        });
        await loadConfig(json.fsPath);
    }

    private async checkIfExistsAngularJson(angularJsonPath: string) {
        const angularJson = await vscode.workspace.findFiles(angularJsonPath);
        if (angularJson.length === 0) {
            throw new Error("Missing angular.json file, searched path: " + angularJsonPath);
        }
        if (angularJson.length > 1) {
            throw new Error("Found multiple angular.json files, searched path: " + angularJsonPath);
        }
        return angularJson[0];
    }

    private async getConfig(fsPath: string, project: string | null): Promise<AngularConfig> {
        const json = await fs.promises.readFile(fsPath, { encoding: 'utf-8' });
        const mainDir = path.dirname(fsPath);

        const configObj = JSON.parse(json);
        const projectName = project ?? configObj.defaultProject as string;

        const options = configObj.projects[projectName].architect.build.options;
        const styles = (options.styles as string[] ?? []).map(x => {
            return path.join(mainDir, x);
        });

        const includePaths = options?.stylePreprocessorOptions?.includePaths as string[] ?? [];
        const includePathsFs = includePaths.map(x => {
            return path.join(mainDir, x);
        });

        return {
            path: fsPath,
            project: projectName,
            styles: styles,
            includePaths: includePathsFs,
            nodeModulesLocation: path.join(mainDir, 'node_modules'),
        };
    }

    dispose() {
        this.config.complete();
        this.watcher?.dispose();
    }
}

export const angularConfigProvider = new AngularConfigProvider();