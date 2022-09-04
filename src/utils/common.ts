import * as vscode from 'vscode';

export enum StyleSyntax {
    scss = 'scss',
    css = 'css',
    sass = 'sass',
    less = 'less',
}

export type SuggestionType = 'class' | 'id';
export type StyleSuggestions = Map<string, vscode.CompletionItem>;
export type StyleSuggestionsByType = { [key in SuggestionType]: StyleSuggestions };

export function getDefaultParsingResult() {
    return { class: new Map(), id: new Map() };
}

export function extractCompletitionItemsFromGrouped(result: StyleSuggestionsByType, type: SuggestionType): vscode.CompletionItem[] {
    const items = type === 'class'
        ? result.class
        : result.id;
    return Array.from(items).map(x => x[1]);
}

export function joinSuggestions(a: StyleSuggestionsByType, b: StyleSuggestionsByType, mutateFirst: boolean = false) {
    let result: StyleSuggestionsByType;
    if (mutateFirst === false) {
        result = getDefaultParsingResult();
        addMaps(result.class, a.class, true);
        addMaps(result.id, a.id, true);
    }
    else {
        result = a;
    }

    addMaps(result.class, b.class, true);
    addMaps(result.id, b.id, true);

    return result;
}

export function addMaps<K, V>(a: Map<K, V>, b: Map<K, V>, mutateFirst: boolean = false) {
    if (mutateFirst === false) {
        a = new Map<K, V>(a);
    }

    b.forEach((v, k) => {
        if (a.has(k) === false) {
            a.set(k, v);
        }
    });
    return a;
}

export function isDocumentInlineTemplate(document: vscode.TextDocument) {
    //if angular language service is installed and template is inlined path will point to virtual doc with .ts.html extension
    return document.uri.path.endsWith(".ts.html");
}

export function isNotNull<T>(x: T | null | undefined): x is T {
    return x != null;
}