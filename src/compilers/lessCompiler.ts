import * as less from 'less';
import * as vscode from 'vscode';
import * as path from 'path';
import { StyleSyntax } from "../common";
import { angularConfigProvider } from '../providers/angularConfigProvider';
import { StyleCompilationResult, StyleCompiler } from "./styleCompiler";


export class LessCompiler implements StyleCompiler {

    async compileFile(path: string): Promise<StyleCompilationResult> {
        try {
            const doc = await vscode.workspace.openTextDocument(path);
            return await this.compileStringInternal(doc.getText(), path);
        }
        catch (e) {
            console.error(`Failed parsing less file ${path}: ${e}`);
            return {
                css: '',
                path,
            };
        }
    }

    async compileString(content: string, syntax: StyleSyntax, path?: string): Promise<StyleCompilationResult> {
        try {
            return this.compileStringInternal(content, path);
        }
        catch (e) {
            console.error(`Failed compiling less content ${path}: ${e}`);
            return {
                css: '',
                path: path ?? '',
            };
        }
    }

    private async compileStringInternal(content: string, path?: string): Promise<StyleCompilationResult> {
        const result = await less.render(content, this.getLessOptions(path));
        return {
            css: result.css,
            path: path ?? '',
            sourceMap: result.map != null && result.map !== '' ? JSON.parse(result.map) : undefined
        };
    }

    private getLessOptions(stylePath?: string): Less.Options {
        const nodePath = angularConfigProvider.configSnapshot?.nodeModulesLocation;
        const paths = angularConfigProvider.configSnapshot?.includePaths ?? [];
        if (nodePath != null) {
            paths.push(nodePath);
        }
        if (stylePath != null && stylePath !== '') {
            paths.push(path.dirname(stylePath));
        }

        return {
            paths: paths,
            sourceMap: {
                outputSourceFiles: true,
            }
        };
    }
}