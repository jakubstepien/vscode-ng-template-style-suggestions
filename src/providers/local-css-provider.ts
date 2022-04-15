import * as vscode from 'vscode';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { TypescriptParser } from '../parsers/typescript-parser';

export class LocalCssProvider {
    private static sortingPrefix: string = 'style1';
    
    constructor(private document: vscode.TextDocument) {
    }

    public async getCompletitionItems(): Promise<Map<string, vscode.CompletionItem>> {
        const doc = await this.getTemplateDoc();
        if (doc == null) {
            return new Map();
        }
        const urls = new TypescriptParser().getStylesUrls(doc);
        if (urls == null) {
            return new Map();
        }

        const items = await new SassFileToCompletionItemsParser().getCompletitionItems(urls);
        items.forEach(x => x.sortText = LocalCssProvider.sortingPrefix + x.label);
        return items;
    }

    private async getTemplateDoc() {
        try {
            const path = this.document.uri.path;
            const extensionStart = path.lastIndexOf('.');
            const baseName = path.substring(0, extensionStart);
            const expectedFileName = `${baseName}.ts`;

            const doc = await vscode.workspace.openTextDocument(expectedFileName);
            return doc;
        }
        catch (e) {
            console.error("Error getting component file");
            return null;
        }
    }
}