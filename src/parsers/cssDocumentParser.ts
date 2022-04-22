import * as vscode from 'vscode';
import * as sass from 'sass';
import * as fs from 'fs';
import * as path from 'path';
import * as sourceMap from 'source-map-js';
import { getCSSLanguageService, LanguageService, SymbolInformation } from "vscode-css-languageservice";
import { url } from 'inspector';

type Doc = {
    uri: string;
    getText: (range?: vscode.Range | undefined) => string;
    languageId: string; lineCount: number;
    offsetAt: (position: vscode.Position) => number;
    positionAt: (offset: number) => vscode.Position;
    version: number;
};

const classRegex = /[.]([\w-]+)/g;

export class CssDocumentParser {

    private cssLanguageService: LanguageService;

    constructor(private styleSourceMap?: sourceMap.RawSourceMap, private pathsToIgnore?: RegExp[]) {
        this.cssLanguageService = getCSSLanguageService();
    }

    public async getCompletitionItems(docPath: string, doc: vscode.TextDocument) {
        const definitions = new Map<string, vscode.CompletionItem>();
        const isSourceAcceptable = this.getIsSourceAcceptableFunc();

        const addDefinitionsFromDoc = async (docPath: string, doc: vscode.TextDocument, symbolFilter?: (sym: SymbolInformation) => boolean) => {
            const mappedDoc = CssDocumentParser.mapDocument(doc);
            const style = this.cssLanguageService.parseStylesheet(mappedDoc);
            const symbols = this.cssLanguageService.findDocumentSymbols(mappedDoc, style);
            this.addDefinitionsFromSymbols(definitions, symbols, symbolFilter ?? (() => true));
            const extraCssPaths = this.parseCssStyleImports(docPath, mappedDoc, style);

            for (const cssPath of extraCssPaths) {
                try {
                    const cssDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(cssPath));
                    const cssDocDir = path.dirname(cssPath);
                    addDefinitionsFromDoc(cssDocDir, cssDoc);
                }
                catch (e) {
                    console.debug('Failed to load css import: ' + e);
                 }
            }
        };

        try {
            addDefinitionsFromDoc(docPath, doc, isSourceAcceptable);
        }
        catch (e) {
            console.log(e);
        }
        return definitions;
    }

    private addDefinitionsFromSymbols(definitions: Map<string, vscode.CompletionItem>, symbols: SymbolInformation[], filter: (sym: SymbolInformation) => boolean) {
        for (const symbol of symbols) {
            var matches = symbol.name.match(classRegex);
            if (matches == null) {
                continue;
            }

            if (filter(symbol) === false) {
                continue;
            }

            for (const match of matches) {
                const text = match.substring(1);
                if (definitions.has(text) === false) {
                    definitions.set(text, this.createCompletitionItem(text));
                }
            }
        }
    }

    /**
     * Parses css style imports that aren't inline during sass compilation
     */
    private parseCssStyleImports(docPath: string, doc: Doc, style: any) {
        if (docPath == null || docPath === '') {
            return [];
        }

        const dir = path.dirname(docPath);
        var children = style.children as any[];
        if (children == null) {
            return [];
        }

        const urls = new Set<string>();
        for (const node of children) {
            if (node.type === 54) {
                try {
                    const url = node.children[0].getText() as string;
                    urls.add(path.join(dir, url.substring(1, url.length - 1)));
                }
                catch { }
            }
        }
        return Array.from(urls);
    }

    private createCompletitionItem(text: string): vscode.CompletionItem {
        return new vscode.CompletionItem({
            label: text,
        }, vscode.CompletionItemKind.Field);
    }

    private getIsSourceAcceptableFunc() {
        if (this.styleSourceMap != null && this.pathsToIgnore != null && this.pathsToIgnore.length > 0) {
            try {
                const sourceMapConsumer = new sourceMap.SourceMapConsumer(this.styleSourceMap);
                return (symbol: SymbolInformation) => {
                    //for some reason line needs to be moved to next, character is ok
                    const start = { column: symbol.location.range.start.character, line: symbol.location.range.start.line + 1 };
                    const originalStart = sourceMapConsumer!.originalPositionFor(start);
                    const source = originalStart.source;

                    return this.pathsToIgnore!.some(reg => reg.test(source)) === false;
                };
            }
            catch (e) {
                console.error("Error parsing sourcemap: " + e);
            }
        }
        return () => true;
    }

    private static mapDocument(document: vscode.TextDocument): Doc {
        return {
            uri: document.uri.path,
            getText: document.getText,
            languageId: document.languageId,
            lineCount: document.lineCount,
            offsetAt: document.offsetAt,
            positionAt: document.positionAt,
            version: document.version
        };
    }
}