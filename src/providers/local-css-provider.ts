import * as vscode from 'vscode';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { DecoratorByNameMatchingStrategy } from '../parsers/typescript-component-decorator/decorator-by-name-matching-strategy';
import { DecoratorByPositionMatchingStrategy } from '../parsers/typescript-component-decorator/decorator-by-position-matching-strategy';
import { TypescriptComponentDecoratorParser } from '../parsers/typescript-component-decorator/typescript-component-decorator-parser';
import { addMaps } from '../utils/common';

export class LocalCssProvider {
    private static sortingPrefix: string = 'style1';
    private isInline: boolean;

    constructor(private document: vscode.TextDocument, private position: vscode.Position) {
        //if angular language service is installed and template is inlined path will point to virtual doc with .ts.html extension
        this.isInline = document.uri.path.endsWith(".ts.html");
    }

    public async getCompletitionItems(): Promise<Map<string, vscode.CompletionItem>> {
        const doc = await this.getMatchingDoc('.ts');
        if (doc == null) {
            return this.getCompletitionItemsBasedOnDirectory();
        }

        const tsParser = new TypescriptComponentDecoratorParser(doc);

        //if is inline I cannot use name since there may by multiple components in file and they won't have template url
        //so I look for decorator which contains cursor position
        const decoratorMatchingStrategy = this.isInline
            ? new DecoratorByPositionMatchingStrategy(this.position)
            : new DecoratorByNameMatchingStrategy(doc);
        const result = tsParser.getStylesFromDecorator(decoratorMatchingStrategy);

        if (result == null || (result[0].length === 0 && result[1].length === 0)) {
            return this.getCompletitionItemsBasedOnDirectory();
        }

        const items = new Map<string, vscode.CompletionItem>();
        const parser = new SassFileToCompletionItemsParser();

        const toParse = [
            { data: result[0], file: true },
            { data: result[1], file: false }
        ];

        const parsed = toParse.map(x => parser.getCompletitionItems(x.data, x.file));
        for (const parseResult$ of parsed) {
            const res = await parseResult$;
            if (res == null) {
                continue;
            }
            addMaps(items, res, true);
        }

        this.setItemsOrder(items);
        return items;
    }

    private setItemsOrder(items: Map<string, vscode.CompletionItem>) {
        items.forEach(x => x.sortText = LocalCssProvider.sortingPrefix + x.label);
    }

    /**
     * Fallback method to search from css file matched by name if matching from decorator fails
     */
    private async getCompletitionItemsBasedOnDirectory(): Promise<Map<string, vscode.CompletionItem>> {
        const doc = await this.getMatchingDoc('.scss')
            ?? await this.getMatchingDoc(".sass")
            ?? await this.getMatchingDoc(".css");

        if (doc == null) {
            return new Map();
        }

        const parser = new SassFileToCompletionItemsParser();
        const items = await parser.getCompletitionItemsFromFile([doc.uri.fsPath]);
        this.setItemsOrder(items);
        return items;
    }

    private async getMatchingDoc(extension: string) {
        try {

            let expectedFileName = '';
            if (this.isInline) {
                //with angular language service schema for inline is 'angular-embedded-content'
                //workspace.openTextDocument wont work on it's fsPath without removing /file://
                const decoded = decodeURIComponent(this.document.uri.path);
                const uri = vscode.Uri.parse(decoded);
                const uriWithoutFile = uri.path.substring('/file://'.length);
                const extensionStart = uriWithoutFile.lastIndexOf('.ts.html');
                expectedFileName = uriWithoutFile.substring(0, extensionStart) + extension;
            }
            else {
                const path = this.document.uri.path;
                const extensionStart = path.lastIndexOf('.');
                const baseName = path.substring(0, extensionStart);
                expectedFileName = baseName + extension;
            }

            const doc = await vscode.workspace.openTextDocument(expectedFileName);
            return doc;
        }
        catch (e) {
            console.error(`Error getting component ${this.document.uri.path} matching file ${extension}: ${e}`);
            return null;
        }
    }
}