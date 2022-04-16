import * as vscode from 'vscode';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { TypescriptComponentDecoratorParser } from '../parsers/typescript-component-decorator-parser';
import { addMaps } from '../utils/common';

export class LocalCssProvider {
    private static sortingPrefix: string = 'style1';
    private isInline: boolean;

    constructor(private document: vscode.TextDocument, private position: vscode.Position | null = null) {
        //if template is inlined path will point to vierual doc with .ts.html extension
        this.isInline = document.uri.path.endsWith(".ts.html");
    }

    public async getCompletitionItems(): Promise<Map<string, vscode.CompletionItem>> {
        const doc = await this.getTemplateDoc();
        if (doc == null) {
            return new Map();
        }

        const tsParser = new TypescriptComponentDecoratorParser();
        const result = tsParser.getStyles(doc, this.isInline ? this.position : null);
        if (result == null) {
            return new Map();
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

        items.forEach(x => x.sortText = LocalCssProvider.sortingPrefix + x.label);
        return items;
    }

    private async getTemplateDoc() {
        try {

            let expectedFileName = '';
            if (this.isInline) {
                //with angular language service schema for inline is 'angular-embedded-content'
                //workspace.openTextDocument wont work on it's fsPath without removing /file://
                const decoded = decodeURIComponent(this.document.uri.path);
                const uri = vscode.Uri.parse(decoded);
                const uriWithoutFile = uri.path.substring('/file://'.length);
                //remove .html so it ends with .ts
                const extensionStart = uriWithoutFile.lastIndexOf('.html');
                expectedFileName = uriWithoutFile.substring(0, extensionStart);
            }
            else {
                const path = this.document.uri.path;
                const extensionStart = path.lastIndexOf('.');
                const baseName = path.substring(0, extensionStart);
                expectedFileName = `${baseName}.ts`;
            }

            const doc = await vscode.workspace.openTextDocument(expectedFileName);
            return doc;
        }
        catch (e) {
            console.error("Error getting component file");
            return null;
        }
    }
}