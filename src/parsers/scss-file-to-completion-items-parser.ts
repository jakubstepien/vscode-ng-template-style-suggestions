import * as vscode from 'vscode';
import * as sass from 'sass';
import { TempDocumentContentProvider } from '../document-content-providers/temp-document-content-provider';
import { getCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { mapDocument } from '../utils/css-language-service-utils';
import { addMaps } from '../utils/common';
import { angularConfigProvider } from '../providers/angular-config-provider';
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
            const results = await Promise.all(styleUrls.map(x => sass.compile(x, this.getSassOptions())));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch (e) {
            console.error("Error Compiling scss string: " + e);
            return new Map();
        }
    }

    private getSassOptions(): sass.Options<"sync"> | undefined {
        const nodePath = angularConfigProvider.configSnapshot?.nodeModulesLocation;
        const paths = angularConfigProvider.configSnapshot?.includePaths ?? [];
        if (nodePath != null) {
            paths.push(nodePath);
        }

        return {
            loadPaths: paths,
            sourceMap: true,
            sourceMapIncludeSources: true,
            logger: {
                debug(msg, opt){
                    console.log(msg, opt);
                },
                warn(msg, opt){
                    console.log(msg,opt);
                }
            },
            importers: [{
                canonicalize(url, opt) {
                    return new URL('');
                },
                load(url){
                    return null;
                }
                // //https://sass-lang.com/documentation/js-api/interfaces/FileImporter
                // findFileUrl(url) {
                //     if (!url.startsWith('~')) {
                //         return null;
                //     }
                //     return new URL(url.substring(1), pathToFileURL(nodePath + '/'));
                // },
            }],
        };
    }

    public async getCompletitionItemsCode(styles: string[]): Promise<Map<string, vscode.CompletionItem>> {
        if (styles == null || styles.length === 0) {
            return new Map();
        }

        try {
            const results = await Promise.all(styles.map(x => sass.compileString(x, this.getSassOptions())));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch (e) {
            console.error("Error Compiling scss string: " + e);
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