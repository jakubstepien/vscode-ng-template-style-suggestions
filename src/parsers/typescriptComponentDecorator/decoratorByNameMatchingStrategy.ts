import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as path from 'path';
import { ComponentDecoratorData, IDecoratorMatchingStrategy, templateUrlPropertyName } from './common';

export class DecoratorByNameMatchingStrategy implements IDecoratorMatchingStrategy {
    private baseName: string;
    constructor(
        private doc: vscode.TextDocument
    ) {
        this.baseName = path.basename(this.doc.uri.fsPath, path.extname(this.doc.uri.fsPath)) + ".html'";
    }

    matches(sourceFile: ts.SourceFile, decoratorNode: ts.Decorator, decoratorData: ComponentDecoratorData): boolean {
        const templateUrl = decoratorData[templateUrlPropertyName] as string;
        return templateUrl.endsWith(this.baseName);
    }
}