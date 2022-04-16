import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ComponentDecoratorData, componentDecoratorName, IDecoratorMatchingStrategy, StyleParseResult, stylesPropertyName, styleUrlsPropertyName } from './common';


export class TypescriptComponentDecoratorParser {
    private sourceFile: ts.SourceFile | null;

    constructor(private doc: vscode.TextDocument) {
        this.sourceFile = this.decompileFile();
    }

    public getStylesFromDecorator(matchingStrategy: IDecoratorMatchingStrategy): StyleParseResult | null {
        try {
            if (this.sourceFile?.statements == null) {
                return null;
            }
            const [styleUrls, inlineStyles] = this.extractStylesFromDecorators(matchingStrategy);

            const dir = path.dirname(this.doc.uri.fsPath);
            const urls = styleUrls.map(x => path.join(dir, x));
            return [urls, inlineStyles];
        }
        catch {
            return null;
        }
    }

    private extractStylesFromDecorators(matchingStrategy: IDecoratorMatchingStrategy): StyleParseResult {
        const componentDecorator = this.findDecorator(matchingStrategy);
        if (componentDecorator == null) {
            return [[], []];
        }
        else {
            const styleUrls: string[] = [];
            const inlineStyles: string[] = [];

            const foundStyleUrls = componentDecorator[styleUrlsPropertyName] as string[];
            if (foundStyleUrls != null && foundStyleUrls.length > 0) {
                foundStyleUrls.forEach(x => styleUrls.push(x));
            }
            const foundStyles = componentDecorator[stylesPropertyName] as string[];
            if (foundStyles != null && foundStyles.length > 0) {
                foundStyles.forEach(x => inlineStyles.push(x));
            }
            return [styleUrls, inlineStyles];
        }
    }

    private findDecorator(matchingStrategy: IDecoratorMatchingStrategy): ComponentDecoratorData | null {
        for (const statement of this.sourceFile!.statements) {
            if (statement.decorators == null) {
                continue;
            }

            for (const decorator of statement.decorators) {
                const expression = decorator.expression as ts.CallExpression;
                if (expression.expression.getText() !== componentDecoratorName) {
                    continue;
                }

                const componentDecorator = this.parseDecoratorFromExpression(expression);

                if (matchingStrategy.matches(this.sourceFile!, decorator, componentDecorator)) {
                    return componentDecorator;
                }
            }
        }

        return null;
    }

    private parseDecoratorFromExpression(decoratorExpression: ts.CallExpression) {
        const componentDecorator: ComponentDecoratorData = {};
        const decoratorArgument = decoratorExpression.arguments[0] as ts.ObjectLiteralExpression;
        for (const prop of decoratorArgument.properties) {
            const propExpr = prop as ts.PropertyAssignment;
            const name = propExpr.name?.getText();
            if (name === styleUrlsPropertyName || name === stylesPropertyName) {
                TypescriptComponentDecoratorParser.parseDecoratorStringArrayValues(propExpr, componentDecorator, name);
            }
            else {
                const value = propExpr.initializer.getText();
                componentDecorator[name] = value;
            }
        }
        return componentDecorator;
    }

    private static parseDecoratorStringArrayValues(propExpr: ts.PropertyAssignment, componentDecorator: ComponentDecoratorData, name: string) {
        const styles: string[] = [];
        const valExpr = propExpr.initializer as ts.ArrayLiteralExpression;
        for (const element of valExpr.elements) {
            const text = element.getText();
            //element is surrounded with ' ' that needs to be removed
            styles.push(text.substring(1, text.length - 1));
        }
        componentDecorator[name] = styles;
    }


    private decompileFile() {
        try {
            const normalizedName = path.normalize(this.doc.uri.fsPath).replace(/\\/g, '/');
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
                getNewLine: () => this.doc.eol === 1 ? '\n' : '\r\n',
                getSourceFile: (filenameToGet: string) => {
                    const source = this.doc.getText();
                    const target = compilerOptions.target == null ? ts.ScriptTarget.ES5 : compilerOptions.target;
                    return ts.createSourceFile(filenameToGet, source, target, true);
                },
                readFile: (x: string) => x,
                useCaseSensitiveFileNames: () => true,
                writeFile: (x: string) => x,
            };

            const program = ts.createProgram([normalizedName], compilerOptions, compilerHost);
            return program.getSourceFile(normalizedName) ?? null;
        }
        catch (e) {
            console.error(`Error parsing ts file: ${this.doc.uri.fsPath}: ${e}`);
            return null;
        }

    }
}