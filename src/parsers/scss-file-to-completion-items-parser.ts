import * as vscode from 'vscode';
import * as sass from 'sass';
import { TempDocumentContentProvider } from '../document-content-providers/temp-document-content-provider';
import { addMaps } from '../utils/common';
import { angularConfigProvider } from '../providers/angular-config-provider';
import { pathToFileURL } from 'url';
import { CssDocumentParser } from './css-document-parser';

export class SassFileToCompletionItemsParser {

    constructor(private pathsToIgnore: RegExp[] = []) {
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
            sourceMap: this.pathsToIgnore.length > 0,
            sourceMapIncludeSources: false,
            importers: [{
                //https://sass-lang.com/documentation/js-api/interfaces/FileImporter
                findFileUrl(url) {
                    if (!url.startsWith('~')) {
                        return null;
                    }
                    return new URL(url.substring(1), pathToFileURL(nodePath + '/'));
                },
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
        const documentPromises = documents.map(async (tempDocPromise, index) => {
            let uuid = '';
            try {
                const [doc, docUuid] = await tempDocPromise;
                uuid = docUuid;

                const cssParser = new CssDocumentParser(sassResults[index].sourceMap, this.pathsToIgnore);
                return cssParser.getCompletitionItems(doc);
            }
            finally {
                TempDocumentContentProvider.freeDocument(uuid);
            }
        });
        return (await Promise.all(documentPromises)).reduce((a, b) => addMaps(a, b, true));
    }    
}