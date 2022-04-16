import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/* eslint-disable @typescript-eslint/naming-convention */
const component_DECORATOR_NAME = "Component";
const styleUrls_PROPERTY_NAME = 'styleUrls';
const styles_PROPERTY_NAME = 'styles';
const templateUrl_PROPERTY_NAME = 'templateUrl';
/* eslint-enable @typescript-eslint/naming-convention */

type ComponentDecoratorData = { [key: string]: string | string[]; };
export type StyleParseResult = [styleUrls: string[], inlineStyles: string[]];
export class TypescriptComponentDecoratorParser {

    public getStyles(doc: vscode.TextDocument, decoratorTemplatePosition: vscode.Position | null = null): StyleParseResult | null {
        try {
            const file = TypescriptComponentDecoratorParser.decompileFile(doc);
            if (file?.statements == null) {
                return null;
            }
            const [styleUrls, inlineStyles] = this.extractStylesFromDecorators(doc, file, decoratorTemplatePosition);

            const dir = path.dirname(doc.uri.fsPath);
            const urls = styleUrls.map(x => path.join(dir, x));
            return [urls, inlineStyles];
        }
        catch {
            return null;
        }
    }

    private extractStylesFromDecorators(doc: vscode.TextDocument, sourceFile: ts.SourceFile, decoratorTemplatePosition: vscode.Position | null): StyleParseResult {
        const componentDecorator = this.findDecorator(doc, sourceFile, decoratorTemplatePosition);
        if (componentDecorator == null) {
            return [[], []];
        }
        else {
            const styleUrls: string[] = [];
            const inlineStyles: string[] = [];

            const foundStyleUrls = componentDecorator[styleUrls_PROPERTY_NAME] as string[];
            if (foundStyleUrls != null && foundStyleUrls.length > 0) {
                foundStyleUrls.forEach(x => styleUrls.push(x));
            }
            const foundStyles = componentDecorator[styles_PROPERTY_NAME] as string[];
            if (foundStyles != null && foundStyles.length > 0) {
                foundStyles.forEach(x => inlineStyles.push(x));
            }
            return [styleUrls, inlineStyles];
        }
    }

    private findDecorator(doc: vscode.TextDocument, sourceFile: ts.SourceFile, decoratorTemplatePosition: vscode.Position | null): ComponentDecoratorData | null {
        const positionBasedSearch = decoratorTemplatePosition != null;
        const baseName = path.basename(doc.uri.fsPath, path.extname(doc.uri.fsPath)) + ".html'";

        for (const statement of sourceFile?.statements) {
            if (statement.decorators == null) {
                continue;
            }

            for (const decorator of statement.decorators) {
                const expression = decorator.expression as ts.CallExpression;
                if (expression.expression.getText() !== component_DECORATOR_NAME) {
                    continue;
                }

                if (positionBasedSearch && containsPosition(decorator) === false) {
                    continue;
                }

                const componentDecorator: ComponentDecoratorData = {};
                const args = expression.arguments[0] as ts.ObjectLiteralExpression;
                for (const prop of args.properties) {
                    const propExpr = prop as ts.PropertyAssignment;
                    const name = propExpr.name?.getText();
                    if (name === styleUrls_PROPERTY_NAME) {
                        TypescriptComponentDecoratorParser.parseDecoratorStringArrayValues(propExpr, componentDecorator, name);
                    }
                    else if (name === styles_PROPERTY_NAME) {
                        TypescriptComponentDecoratorParser.parseDecoratorStringArrayValues(propExpr, componentDecorator, name);
                    }
                    else {
                        const value = propExpr.initializer.getText();
                        componentDecorator[name] = value;
                    }
                }

                const templateUrl = componentDecorator[templateUrl_PROPERTY_NAME] as string;
                const isSearchedDecorator = positionBasedSearch || templateUrl.endsWith(baseName);
                if (isSearchedDecorator) {
                    return componentDecorator;
                }
            }
        }

        return null;

        function containsPosition(decorator: ts.Decorator) {
            if (decoratorTemplatePosition == null) {
                return false;
            }

            const start = sourceFile.getLineAndCharacterOfPosition(decorator.getStart());
            const end = sourceFile.getLineAndCharacterOfPosition(decorator.getEnd());
            const range = new vscode.Range(new vscode.Position(start.line, start.character), new vscode.Position(end.line, end.character));
            return range.contains(decoratorTemplatePosition);
        }
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