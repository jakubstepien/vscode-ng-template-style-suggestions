import path = require('path');
import { RawSourceMap } from 'source-map-js';
import { StyleSyntax } from '../common';
import { LessCompiler } from './lessCompiler';
import { SassCompiler } from './sassCompiler';
export type StyleCompilationResult = {
    css: string,
    path: string
    sourceMap?: RawSourceMap,
};

export interface StyleCompiler {
    compileFile(path: string): Promise<StyleCompilationResult>;
    compileString(content: string, syntax: StyleSyntax, path?: string): Promise<StyleCompilationResult>;
}

const sassCompiler = new SassCompiler();
const lessCompiler = new LessCompiler();

export function getStyleCompiler(path: string): StyleCompiler;
export function getStyleCompiler(syntax: StyleSyntax): StyleCompiler;
export function getStyleCompiler(syntaxOrPath: StyleSyntax | string): StyleCompiler {
    const ext = path.extname(syntaxOrPath);
    const syntax = ext.startsWith('.')
        ? ext.substring(1)
        : syntaxOrPath;

    switch (syntax) {
        case StyleSyntax.sass:
        case StyleSyntax.css:
        case StyleSyntax.scss:
            return sassCompiler;
        case StyleSyntax.less:
            return lessCompiler;
        default:
            throw new Error(`Compiler for ${syntax} not found`);
    }
}