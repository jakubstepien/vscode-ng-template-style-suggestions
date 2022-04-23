import * as vscode from 'vscode';
import * as path from 'path';

import { getDefaultParsingResult, StyleSuggestions, StyleSuggestionsByType, StyleSyntax } from "../common";
import { TempDocumentContentProvider } from '../documentContentProviders/tempDocumentContentProvider';
import { SassCompiler, StyleCompilationResult } from '../compilers/sassCompiler';
import { CssParser } from './css/cssParser';

export class StylesToCompletitionItemsParser {

    public async getCompletitionItemsFromFile(styleUrls: string[]): Promise<StyleSuggestionsByType> {
        if (styleUrls == null || styleUrls.length === 0) {
            return getDefaultParsingResult();
        }
        try {
            const { compiledStylesUrls, cssStylesUrls } = this.splitStylesByType(styleUrls);

            const cssParser = new CssParser();
            const parsingCompiled = this.parseCompiledStyles(cssParser, compiledStylesUrls);
            const parsingCssStyles = this.parseCssStyles(cssStylesUrls, cssParser);
            await Promise.all([parsingCompiled, parsingCssStyles]);

            return this.getItemsFromParserResults(cssParser);
        }
        catch (e) {
            console.error("Error Compiling scss string: " + e);
            return getDefaultParsingResult();
        }
    }

    private splitStylesByType(styleUrls: string[]) {
        const cssStylesUrls: string[] = [];
        const compiledStylesUrls: string[] = [];
        for (const url of styleUrls) {
            const ext = path.extname(url).substring(1);
            if (ext === StyleSyntax.css) {
                cssStylesUrls.push(url);
            }
            else {
                compiledStylesUrls.push(url);
            }
        }
        return { compiledStylesUrls, cssStylesUrls };
    }

    private parseCompiledStyles(cssParser: CssParser, compiledStylesUrls: string[]) {
        return Promise.all(compiledStylesUrls.map(async (path) => {
            const style = SassCompiler.compileFile(path);
            await TempDocumentContentProvider.useTempDocument(style.css,
                async doc => await cssParser.addSymbols(style.path, doc, style.sourceMap));
        }));
    }

    private parseCssStyles(compiledStylesUrls: string[], cssParser: CssParser) {
        return Promise.all(compiledStylesUrls.map(async (path) => {
            try {
                const doc = await vscode.workspace.openTextDocument(path);
                await cssParser.addSymbols(path, doc);
            }
            catch (e) {
                console.error("Error parsing css file " + path);
            }
        }));
    }

    private getItemsFromParserResults(cssParser: CssParser) {
        const parsingResults = cssParser.getResults();
        const result: StyleSuggestionsByType = {
            class: new Map(),
            id: new Map(),
        };
        parsingResults.class.filter(x => !result.class.has(x)).forEach(x => result.class.set(x, this.createCompletitionItem(x)));
        parsingResults.id.filter(x => !result.id.has(x)).forEach(x => result.id.set(x, this.createCompletitionItem(x)));
        return result;
    }

    public async getCompletitionItemsFromCode(styles: string[], syntax: StyleSyntax, path?: string): Promise<StyleSuggestionsByType> {
        const cssParser = new CssParser();

        let readyStyles: StyleCompilationResult[];
        if (syntax === StyleSyntax.css) {
            readyStyles = styles.map(x => ({ css: x, path: path ?? '' }));
        }
        else {
            readyStyles = styles.map(x => SassCompiler.compileString(x, syntax, path));
        }

        await Promise.all(readyStyles.map(async style => {
            await TempDocumentContentProvider.useTempDocument(style.css,
                async doc => await cssParser.addSymbols(style.path, doc, style.sourceMap));
        }));
        return this.getItemsFromParserResults(cssParser);
    }

    private createCompletitionItem(text: string): vscode.CompletionItem {
        return new vscode.CompletionItem({
            label: text,
        }, vscode.CompletionItemKind.Field);
    }
}