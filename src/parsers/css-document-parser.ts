import * as vscode from 'vscode';
import * as sass from 'sass';
import * as fs from 'fs'
import * as sourceMap from 'source-map-js';
import { getCSSLanguageService, LanguageService, SymbolInformation } from "vscode-css-languageservice";

const classRegex = /[.]([\w-]+)/g;

export class CssDocumentParser {

    private cssLanguageService: LanguageService;

    constructor(private styleSourceMap?: sourceMap.RawSourceMap, private pathsToIgnore?: RegExp[]) {
        this.cssLanguageService = getCSSLanguageService();
    }

    public async getCompletitionItems(doc: vscode.TextDocument) {
        const definitions = new Map<string, vscode.CompletionItem>();
        const isSourceAcceptable = this.getIsSourceAcceptableFunc();
        try {
            const mappedDoc = CssDocumentParser.mapDocument(doc);
            const style = this.cssLanguageService.parseStylesheet(mappedDoc);
            const symbols = this.cssLanguageService.findDocumentSymbols(mappedDoc, style);

            for (const symbol of symbols) {
                var matches = symbol.name.match(classRegex);
                if (matches == null) {
                    continue;
                }

                if (isSourceAcceptable(symbol) === false) {
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
        catch (e) {
            console.log(e);
        }

        return definitions;
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

    private static mapDocument(document: vscode.TextDocument) {
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