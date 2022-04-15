import path = require('path');
import * as vscode from 'vscode';
import { LanguageService, Range } from 'vscode-css-languageservice';

export function mapDocument(document: vscode.TextDocument) {
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

export function mapRange(range: Range) {
    const start = new vscode.Position(range.start.line, range.start.character);
    const end = new vscode.Position(range.end.line, range.end.character);
    return new vscode.Range(start, end);
}

