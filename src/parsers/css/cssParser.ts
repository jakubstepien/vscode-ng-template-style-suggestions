import * as vscode from 'vscode';
import * as path from 'path';

import { RawSourceMap, SourceMapConsumer } from "source-map-js";
import { SuggestionType } from "../../common";
import { getPathsToIgnore } from "../../configurationHelper";
import { getCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { NodeData, StylesheetVisitor, StylesheetNode } from "./stylesheetVisitor";

type Doc = {
    uri: string;
    getText: (range?: vscode.Range | undefined) => string;
    languageId: string; lineCount: number;
    offsetAt: (position: vscode.Position) => number;
    positionAt: (offset: number) => vscode.Position;
    version: number;
};

export class CssParser {
    private pathsToIgnore: RegExp[];
    private cssLanguageService: LanguageService;
    private symbols: { [key in SuggestionType]: Set<string> };

    constructor(pathsToIgnore?: RegExp[]) {
        this.pathsToIgnore = pathsToIgnore ?? getPathsToIgnore();
        this.cssLanguageService = getCSSLanguageService();

        this.symbols = {
            class: new Set<string>(),
            id: new Set<string>()
        };
    }

    public async addSymbols(docPath: string, doc: vscode.TextDocument, sourceMaps?: RawSourceMap) {
        try {
            const sourceMapConsumer = sourceMaps == null ? undefined : new SourceMapConsumer(sourceMaps);
            await this.addSymbolsInternal(docPath, doc, sourceMapConsumer);
        }
        catch (e) {
            console.error(`Failed to add symbols for ${docPath}: ${e}`);
        }
    }

    private async addSymbolsInternal(docPath: string, doc: vscode.TextDocument, sourceMapConsumer?: SourceMapConsumer) {
        const mappedDoc = CssParser.mapDocument(doc);
        const dirPath = path.dirname(docPath);

        const stylesheet = this.cssLanguageService.parseStylesheet(mappedDoc) as StylesheetNode;

        //css style import eg. import "foo.css" won't be inlined in scss
        //so I need to keep track of them and parse then separately later
        const additionalCssImports: Set<string> = new Set();

        const callback = this.getVisitorCallback(dirPath, mappedDoc, additionalCssImports, sourceMapConsumer);

        const visitor = new StylesheetVisitor(doc, x => callback(x));
        stylesheet.acceptVisitor(visitor);

        for (const extraUrl of additionalCssImports) {
            try {
                const extraDoc = await vscode.workspace.openTextDocument(extraUrl);
                await (this.addSymbolsInternal(extraUrl, extraDoc, sourceMapConsumer));
            }
            catch (e) {
                console.warn(`Failed to add symbols for css import ${extraUrl}: ${e}`);
            }
        }
    }

    private getVisitorCallback(dirPath: string, mappedDoc: Doc, additionalCssImports: Set<string>, sourceMapConsumer?: SourceMapConsumer) {
        const sourceFilter = this.getSourceIgnoredFilter(mappedDoc, sourceMapConsumer);
        const importFilter = this.getImportIgnoredFilter();

        const callback = (node: NodeData) => {
            try {
                if (node.type === 'import' && importFilter(node) === false) {
                    return;
                }
                if (sourceFilter(node) === false) {
                    return;
                }

                if (node.type === 'selector') {
                    const name = node.text.substring(1);
                    if (node.text[0] === '.') {
                        this.symbols.class.add(name);
                    }
                    else if (node.text.startsWith('#')) {
                        this.symbols.id.add(name);
                    }
                }
                else if (node.type === 'import') {
                    additionalCssImports.add(path.join(dirPath, node.text));
                }
            }
            catch (e) {
                console.error('Failed to parse css document node', node);
            }
        };
        return callback;
    }

    public getResults(): { [key in SuggestionType]: string[] } {
        return {
            class: Array.from(this.symbols.class),
            id: Array.from(this.symbols.id),
        };
    }

    private getImportIgnoredFilter() {
        if (this.pathsToIgnore == null || this.pathsToIgnore.length === 0) {
            return (node: NodeData) => true;
        }

        return (node: NodeData) => {
            return this.pathsToIgnore!.some(reg => reg.test(node.text)) === false;
        };
    }

    private getSourceIgnoredFilter(doc: Doc, sourceMapConsumer?: SourceMapConsumer) {
        if (sourceMapConsumer == null || this.pathsToIgnore == null || this.pathsToIgnore.length === 0) {
            return (node: NodeData) => true;
        }
        return (node: NodeData) => {
            const start = { column: node.location.range.start.character, line: node.location.range.start.line + 1 };
            const originalStart = sourceMapConsumer!.originalPositionFor(start);
            const source = originalStart.source;

            return this.pathsToIgnore!.some(reg => reg.test(source)) === false;
        };
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