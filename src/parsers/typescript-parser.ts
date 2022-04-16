import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

type ComponentDecoratorData = { [key: string]: string | string[]; };
export type StyleParseResult = [styleUrls: string[], inlineStyles: string[]];
export class TypescriptParser {

    public getStyles(doc: vscode.TextDocument): StyleParseResult | null {
        const file = TypescriptParser.decompileFile(doc);
        if (file?.statements == null) {
            return null;
        }
        const [styleUrls, inlineStyles] = TypescriptParser.extractStylesFromDecorators(doc, file);

        const dir = path.dirname(doc.uri.fsPath);
        const urls = styleUrls.map(x => path.join(dir, x));
        return [urls, inlineStyles];
    }

    private static extractStylesFromDecorators(doc: vscode.TextDocument, file: ts.SourceFile): StyleParseResult {
        const styleUrls: string[] = [];
        const inlineStyles: string[] = [];

        for (const statement of file?.statements) {
            if (statement.decorators == null) {
                continue;
            }

            let componentDecorator: ComponentDecoratorData = null!;
            for (const decorator of statement.decorators) {
                const expression = decorator.expression as ts.CallExpression;
                if (expression.expression.getText() === "Component") {
                    componentDecorator = {};
                    const args = expression.arguments[0] as ts.ObjectLiteralExpression;
                    for (const prop of args.properties) {
                        const propExpr = prop as ts.PropertyAssignment;
                        const name = propExpr.name?.getText();
                        if (name === 'styleUrls') {
                            TypescriptParser.parseDecoratorArrayValues(propExpr, componentDecorator, name);
                        }
                        else if (name === 'styles') {
                            TypescriptParser.parseDecoratorArrayValues(propExpr, componentDecorator, name);
                        }
                        else {
                            const value = propExpr.initializer.getText();
                            componentDecorator[name] = value;
                        }
                    }
                }

                if (componentDecorator != null) {
                    const baseName = path.basename(doc.uri.fsPath, path.extname(doc.uri.fsPath)) + ".html'";
                    const templateUrl = componentDecorator['templateUrl'] as string;
                    if (templateUrl.endsWith(baseName)) {
                        const foundStyleUrls = componentDecorator['styleUrls'] as string[];
                        if (foundStyleUrls != null && foundStyleUrls.length > 0) {
                            foundStyleUrls.forEach(x => styleUrls.push(x));
                        }
                        const foundStyles = componentDecorator['styles'] as string[];
                        if (foundStyles != null && foundStyles.length > 0) {
                            foundStyles.forEach(x => inlineStyles.push(x));
                        }
                    }
                }
            }
        }

        return [styleUrls, inlineStyles];
    }

    private static parseDecoratorArrayValues(propExpr: ts.PropertyAssignment, componentDecorator: ComponentDecoratorData, name: string) {
        const styles: string[] = [];
        const valExpr = propExpr.initializer as ts.ArrayLiteralExpression;
        for (const element of valExpr.elements) {
            const text = element.getText();
            //element is surrounded with ' ' that needs to be removed
            styles.push(text.substring(1, text.length - 1));
        }
        componentDecorator[name] = styles;
    }


    private static decompileFile(doc: vscode.TextDocument) {
        const normalizedName = path.normalize(doc.uri.fsPath).replace(/\\/g, '/');
        const compilerOptions = {
            allowJs: true,
            noResolve: true,
            target: ts.ScriptTarget.ES5,
        };

        const compilerHost: ts.CompilerHost = {
            fileExists: () => true,
            getCanonicalFileName: (filename: string) => filename,
            getCurrentDirectory: () => "",
            getDefaultLibFileName: () => "lib.d.ts",
            getDirectories: () => [],
            getNewLine: () => doc.eol === 1 ? '\n' : '\r\n',
            getSourceFile: (filenameToGet: string) => {
                const source = doc.getText();
                const target = compilerOptions.target == null ? ts.ScriptTarget.ES5 : compilerOptions.target;
                return ts.createSourceFile(filenameToGet, source, target, true);
            },
            readFile: (x: string) => x,
            useCaseSensitiveFileNames: () => true,
            writeFile: (x: string) => x,
        };

        const program = ts.createProgram([normalizedName], compilerOptions, compilerHost);
        return program.getSourceFile(normalizedName);
    }
}