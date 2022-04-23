import * as vscode from 'vscode';
import * as ts from 'typescript';
import { ComponentDecoratorData, IDecoratorMatchingStrategy } from './common';

export class DecoratorByPositionMatchingStrategy implements IDecoratorMatchingStrategy {
    constructor(
        private activeDecoratorTemplatePosition: vscode.Position
    ) {
    }

    matches(sourceFile: ts.SourceFile, decoratorNode: ts.Decorator, decoratorData: ComponentDecoratorData): boolean {
        return this.containsPosition(sourceFile, decoratorNode);
    }

    private containsPosition(sourceFile: ts.SourceFile, decoratorNode: ts.Decorator) {
        if (this.activeDecoratorTemplatePosition == null) {
            return false;
        }

        const start = sourceFile.getLineAndCharacterOfPosition(decoratorNode.getStart());
        const end = sourceFile.getLineAndCharacterOfPosition(decoratorNode.getEnd());
        const range = new vscode.Range(new vscode.Position(start.line, start.character), new vscode.Position(end.line, end.character));
        return range.contains(this.activeDecoratorTemplatePosition);
    };
}