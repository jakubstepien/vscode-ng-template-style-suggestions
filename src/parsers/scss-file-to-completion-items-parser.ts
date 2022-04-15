import * as vscode from 'vscode';
import * as sass from 'sass';
import { TempDocumentContentProvider } from '../document-content-providers/temp-document-content-provider';
import { getCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { mapDocument } from '../utils/css-language-service-utils';
import { addMaps } from '../utils/common';

export class SassFileToCompletionItemsParser {

    private static classRegex = /[.]([\w-]+)/g;
    private cssLanguageService: LanguageService;
    constructor() {
        this.cssLanguageService = getCSSLanguageService();
    }

    public async getCompletitionItems(styleUrls: string[]) {
        const results = await Promise.all(styleUrls.map(x => sass.compile(x)));
        const items = await this.getSymbolsFromSassResult(results);
        return items;
    }

    private async getSymbolsFromSassResult(sassResults: sass.CompileResult[]) {
        const documents = sassResults.map(x => TempDocumentContentProvider.getDocument(x.css));
        const documentPromises = documents.map(async tempDocPromise => {
            let uuid = '';
            try {
                const tempDocument = await tempDocPromise;
                uuid = tempDocument[1];
                return await this.getDocDefinitions(tempDocument[0]);
            }
            finally {
                TempDocumentContentProvider.freeDocument(uuid);
            }
        });
        return (await Promise.all(documentPromises)).reduce((a, b) => addMaps(a, b, true));
    }

    private async getDocDefinitions(doc: vscode.TextDocument) {
        const mappedDoc = mapDocument(doc);
        const style = this.cssLanguageService.parseStylesheet(mappedDoc);
        const symbols = this.cssLanguageService.findDocumentSymbols(mappedDoc, style);

        const definitions = new Map<string, vscode.CompletionItem>();
        symbols.forEach(x => {
            var matches = x.name.match(SassFileToCompletionItemsParser.classRegex);
            matches?.forEach(x => {
                const text = x.substring(1);
                if (definitions.has(text) === false) {
                    definitions.set(text, new vscode.CompletionItem({
                        label: text,
                    }, vscode.CompletionItemKind.Field));
                }
            });
        });

        return definitions;
    }
}