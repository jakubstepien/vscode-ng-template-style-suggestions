import * as vscode from 'vscode';
import * as sass from 'sass';
import { TempDocumentContentProvider } from '../documentContentProviders/tempDocumentContentProvider';
import { addMaps, StyleSyntax } from '../utils/common';
import { angularConfigProvider } from '../providers/angularConfigProvider';
import { pathToFileURL } from 'url';
import { CssDocumentParser } from './cssDocumentParser';
import { getPathsToIgnore } from '../configurationHelper';

export class SassFileToCompletionItemsParser {
    private pathsToIgnore: RegExp[];

    constructor() {
        this.pathsToIgnore = getPathsToIgnore();
    }

    public async getCompletitionItemsFromFile(styleUrls: string[]): Promise<Map<string, vscode.CompletionItem>> {
        if (styleUrls == null || styleUrls.length === 0) {
            return new Map();
        }

        try {
            const results = await Promise.all(styleUrls.map(x => {
                return {
                    style: sass.compile(x, this.getSassOptions()),
                    path: x
                };
            }));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch (e) {
            console.error("Error Compiling scss string: " + e);
            return new Map();
        }
    }

    private getSassOptions(): sass.Options<"sync"> {
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

    public async getCompletitionItemsFromCode(styles: string[], syntax: StyleSyntax): Promise<Map<string, vscode.CompletionItem>> {
        if (styles == null || styles.length === 0) {
            return new Map();
        }

        try {
            const options: sass.StringOptions<"sync"> = this.getSassOptions();
            options.syntax = this.mapSyntax(syntax);
            const results = await Promise.all(styles.map(x => sass.compileString(x, options)));
            const items = await this.getSymbolsFromSassResult(results);
            return items;
        }
        catch (e) {
            console.error("Error Compiling scss string: " + e);
            return new Map();
        }
    }

    private async getSymbolsFromSassResult(sassResults: sass.CompileResult[]): Promise<Map<string, vscode.CompletionItem>>;
    private async getSymbolsFromSassResult(sassResults: { style: sass.CompileResult, path: string }[]): Promise<Map<string, vscode.CompletionItem>>;
    private async getSymbolsFromSassResult(sassResults: { style: sass.CompileResult, path: string }[] | sass.CompileResult[]): Promise<Map<string, vscode.CompletionItem>> {
        const stylesUnified = sassResults.map(x => {
            if ('path' in x) {
                return x;
            }
            return { style: x, path: '' };
        });
        const styles = stylesUnified.filter(x => x.style.css != null && x.style.css !== '');
        const documentPromises = styles.map(async (style, index) => {
            let uuid = '';
            try {

                const [doc, docUuid] = await TempDocumentContentProvider.getDocument(style.style.css);
                uuid = docUuid;

                const cssParser = new CssDocumentParser(stylesUnified[index].style.sourceMap, this.pathsToIgnore);
                return cssParser.getCompletitionItems(style.path, doc);
            }
            finally {
                TempDocumentContentProvider.freeDocument(uuid);
            }
        });
        if(documentPromises.length === 0){
            return new Map();
        }

        return (await Promise.all(documentPromises)).reduce((a, b) => addMaps(a, b, true));
    }

    private mapSyntax(syntax: StyleSyntax): sass.Syntax {
        return syntax === 'sass' ? 'indented' : syntax ?? 'scss';
    }
}