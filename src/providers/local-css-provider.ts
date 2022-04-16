import * as vscode from 'vscode';
import { SassFileToCompletionItemsParser } from '../parsers/scss-file-to-completion-items-parser';
import { TypescriptParser } from '../parsers/typescript-parser';
import { addMaps } from '../utils/common';

export class LocalCssProvider {
    private static sortingPrefix: string = 'style1';

    constructor(private document: vscode.TextDocument) {
    }

    public async getCompletitionItems(): Promise<Map<string, vscode.CompletionItem>> {
        const doc = await this.getTemplateDoc();
        if (doc == null) {
            return new Map();
        }
        const result = new TypescriptParser().getStyles(doc);
        if (result == null) {
            return new Map();
        }

        const items = new Map<string, vscode.CompletionItem>();
        const parser = new SassFileToCompletionItemsParser();

        const toParse = [
            { data: result[0], file: true },
            { data: result[1], file: false }
        ];

        const parsed = toParse.map(x => {
            try {
                return parser.getCompletitionItems(x.data, x.file);
            }
            catch {
                return null;
            }
        });
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