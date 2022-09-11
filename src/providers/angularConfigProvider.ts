import * as vscode from 'vscode';
import * as fs from 'fs';
import { BehaviorSubject } from "rxjs";
import path = require('path');
import { StyleSyntax } from '../utils/common';
import { getAngularJsonPathPattern } from '../utils/configuration/configurationHelper';

export type AngularConfig = {
    path: Readonly<string>,
    project: Readonly<string>,
    stylesUrls: Readonly<string[]>,
    includePaths: Readonly<string[]>;
    nodeModulesLocation: Readonly<string>;
    syntax: Readonly<StyleSyntax>;
};

class AngularConfigProvider {
    private watcher: vscode.FileSystemWatcher | null = null;
    private config = new BehaviorSubject<AngularConfig | null>(null);
    public config$ = this.config.asObservable();

    get configSnapshot() {
        return this.config.value;
    }

    public async init(project: string | null = null) {
        const loadConfig = async (path: string) => {
            const newConfig = await this.getConfig(path, project);
            this.config.next(newConfig);
        };

        const angularJsonPath = getAngularJsonPathPattern();
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
            const msg = "Missing angular.json file, searched path: " + angularJsonPath;
            await vscode.window.showErrorMessage(msg);
            throw new Error(msg);
        }
        if (angularJson.length > 1) {
            const msg = "Angular templates style suggestions: Found multiple angular.json files, searched path: " + angularJsonPath;
            await vscode.window.showErrorMessage(msg);
            throw new Error(msg);
        }
        return angularJson[0];
    }

    private async getConfig(fsPath: string, projectName: string | null): Promise<AngularConfig> {
        const json = await fs.promises.readFile(fsPath, { encoding: 'utf-8' });
        const mainDir = path.dirname(fsPath);

        const configObj = JSON.parse(json);
        const isProjectNameEmpty = () => projectName == null || projectName === '';

        if (isProjectNameEmpty() && configObj.defaultProject) {
            projectName = configObj.defaultProject as string;
        }
        if (isProjectNameEmpty()) {
            const projectNames = Object.keys(configObj.projects);
            if (projectNames.length > 0) {
                projectName = projectNames[0];
            }
        }
        if (isProjectNameEmpty()) {
            const msg = "Angular templates style suggestions: could not determine project name";
            await vscode.window.showErrorMessage(msg);
            throw new Error(msg);
        }
        projectName = projectName!;
        const project = configObj.projects[projectName];
        if (project == null) {
            console.error(`Project ${projectName} doesn't exist in angular.json ${fsPath}`);
            return {
                path: fsPath,
                project: '',
                stylesUrls: [],
                includePaths: [],
                nodeModulesLocation: path.join(mainDir, 'node_modules'),
                syntax: StyleSyntax.scss
            };
        }
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
            stylesUrls: styles,
            includePaths: includePathsFs,
            nodeModulesLocation: path.join(mainDir, 'node_modules'),
            syntax: this.getSyntax(project, options),
        };
    }

    private getSyntax(project: any, options: any): Readonly<StyleSyntax> {
        if (project?.schematics != null) {
            const schematicsStyle = project?.schematics['@schematics/angular:component']?.style;
            if (schematicsStyle != null) {
                return schematicsStyle;
            }
        }
        return options.inlineStyleLanguage;
    }

    dispose() {
        this.config.complete();
        this.watcher?.dispose();
    }
}

export const angularConfigProvider = new AngularConfigProvider();