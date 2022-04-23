import * as ts from 'typescript';

export const componentDecoratorName = "Component";
export const styleUrlsPropertyName = 'styleUrls';
export const stylesPropertyName = 'styles';
export const templateUrlPropertyName = 'templateUrl';

export type ComponentDecoratorData = { [key: string]: string | string[]; };
export type StyleParseResult = [styleUrls: string[], inlineStyles: string[]];

export interface IDecoratorMatchingStrategy {
    matches(sourceFile: ts.SourceFile, decoratorNode: ts.Decorator, decoratorData: ComponentDecoratorData): boolean;
}
