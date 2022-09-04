import * as vscode from 'vscode';
import { getCSSLanguageService, getLESSLanguageService, getSCSSLanguageService, LanguageService } from 'vscode-css-languageservice';
import { StyleSyntax } from './common';

export type LanguageServiceDocument = {
    uri: string;
    getText: (range?: vscode.Range | undefined) => string;
    languageId: string; lineCount: number;
    offsetAt: (position: vscode.Position) => number;
    positionAt: (offset: number) => vscode.Position;
    version: number;
};

export function mapDocumentToLangServiceDocument(document: vscode.TextDocument): LanguageServiceDocument {
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

export function getLanguageServiceByLanguageType(lang: StyleSyntax): LanguageService;
export function getLanguageServiceByLanguageType(lang: string): LanguageService | null;
export function getLanguageServiceByLanguageType(lang: StyleSyntax | string): LanguageService | null {
    switch (lang) {
        case StyleSyntax.css: return getCSSLanguageService();
        case StyleSyntax.sass: return getSCSSLanguageService();
        case StyleSyntax.scss: return getSCSSLanguageService();
        case StyleSyntax.less: return getLESSLanguageService();
        default: return null;
    }
}