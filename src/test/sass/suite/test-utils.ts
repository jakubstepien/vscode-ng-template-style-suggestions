import { deactivate } from "../../../extension";
import * as vscode from 'vscode';
import { commands, extensionString, ignorePathsForSuggestions } from "../../../configurationHelper";

const mainStylePattern = '**/src/styles.sass';
const otherMainStylePattern = '**/src/other-global-style.sass';

export function activateExtension(): vscode.ExtensionContext | null {
    let contex: vscode.ExtensionContext | null = null;
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension("jakubstepien.vscode-angular-sass-suggestions");
        contex = await ext?.activate() as unknown as vscode.ExtensionContext;
        await commands.resetCache.invoke();

        const opt = await vscode.workspace.getConfiguration(extensionString)
        opt.update(ignorePathsForSuggestions, null);
    });

    suiteTeardown(() => {
        //causes weird race conditions teardown from 1 test triggers after setup from next
        // deactivate();
    });
    return contex;
}

export async function getDocumentForInlineStylesTests(pattern: vscode.GlobPattern, templatePosition: vscode.Position) {
    const files = await vscode.workspace.findFiles(pattern);
    if (files.length !== 1) {
        throw new Error('Invalid number of files found: ' + pattern);
    }

    const originalDoc = await vscode.workspace.openTextDocument(files[0]);
    const originalUri = originalDoc.uri.toString();
    
    //without this vscode wont find angular-embedded-content
    await vscode.window.showTextDocument(originalDoc);
    for (let i = 0; i < 5; i++) {
        try {
            await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', originalDoc.uri, templatePosition);
            const vdocUri = vscode.Uri.file(encodeURIComponent(originalUri) + '.html')
                .with({ scheme: 'angular-embedded-content', authority: 'html' });
            const doc = await vscode.workspace.openTextDocument(vdocUri);
            return doc;
        }
        catch {
            await new Promise(res => {
                setTimeout(() => res(true), 5000);
            });
        }
    }

    throw new Error("Error opening doc " + pattern);
}

export async function resetGlobalStyles() {
    await cleanupFile(otherMainStylePattern);
    await cleanupFile(mainStylePattern);
}

export async function setGlobalStyle(text: string) {
    await setFile(mainStylePattern, text);
    await new Promise(res => {
        setTimeout(() => res(true), 300);
    })
}

export async function setOtherGlobalStyle(text: string) {
    await setFile(otherMainStylePattern, text);
}

export async function setFile(pattern: vscode.GlobPattern, content: string) {
    const files = await vscode.workspace.findFiles(pattern);
    const doc = await vscode.workspace.openTextDocument(files[0]);

    const edit = new vscode.WorkspaceEdit();

    edit.insert(doc.uri, new vscode.Position(0, 0), content);
    const success = await vscode.workspace.applyEdit(edit);
    await doc.save();
}

export async function cleanupFile(pattern: vscode.GlobPattern) {
    const files = await vscode.workspace.findFiles(pattern);
    const doc = await vscode.workspace.openTextDocument(files[0]);

    const edit = new vscode.WorkspaceEdit();
    var range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(doc.lineCount, 0));

    edit.delete(doc.uri, range);
    const success = await vscode.workspace.applyEdit(edit);
    await doc.save();
}