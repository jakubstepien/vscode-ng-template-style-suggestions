import * as vscode from 'vscode';

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
