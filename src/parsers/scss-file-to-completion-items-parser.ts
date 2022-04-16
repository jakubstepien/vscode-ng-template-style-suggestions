import * as vscode from 'vscode';
import * as sass from 'sass';
import { TempDocumentContentProvider } from '../document-content-providers/temp-document-content-provider';
import { getCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { mapDocument } from '../utils/css-language-service-utils';
import { addMaps } from '../utils/common';
import { angularConfigProvider } from '../providers/angular-config-provider';
import path = require('path');
import { pathToFileURL } from 'url';

export class SassFileToCompletionItemsParser {

    private static classRegex = /[.]([\w-]+)/g;
    private cssLanguageService: LanguageService;
    constructor() {
        this.cssLanguageService = getCSSLanguageService();
    }

    public async getCompletitionItems(data: string[], file: boolean): Promise<Map<string, vscode.CompletionItem>> {
        if (file) {
            return this.getCompletitionItemsFromFile(data);
        }
        else {
            return this.getCompletitionItemsCode(data);
        }
    }

    public async getCompletitionItemsFromFile(styleUrls: string[]): Promise<Map<string, vscode.CompletionItem>> {
        if (styleUrls == null || styleUrls.length === 0) {
            return new Map();
        }

        try {
            const nodePath = angularConfigProvider.configSnapshot!.nodeModulesLocation;
            const paths = angularConfigProvider.configSnapshot?.includePathsFs ?? [];
            paths.push(nodePath);

            const results = await Promise.all(styleUrls.map(x => sass.compileAsync(x, {
                loadPaths: paths,
                importers: [{
                    //https://sass-lang.com/documentation/js-api/interfaces/FileImporter
                    findFileUrl(url) {
                        if (!url.startsWith('~')) {
                            return null;
                        }
                        return new URL(url.substring(1), pathToFileURL(nodePath + '/'));
                    },
                }]
            })));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch (e) {
            return new Map();
        }
    }

    public async getCompletitionItemsCode(styles: string[]): Promise<Map<string, vscode.CompletionItem>> {
        if (styles == null || styles.length === 0) {
            return new Map();
        }

        try {
            const results = await Promise.all(styles.map(x => sass.compileStringAsync(x)));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch {
            return new Map();
        }
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