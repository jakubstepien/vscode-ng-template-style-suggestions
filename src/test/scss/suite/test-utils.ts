import { deactivate } from "../../../extension";
import * as vscode from 'vscode';

export function activateExtension(): vscode.ExtensionContext | null {
    let contex: vscode.ExtensionContext | null = null;
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension("jakubstepien.vscode-angular-sass-suggestions");
        contex = await ext?.activate() as unknown as vscode.ExtensionContext;
    });

    suiteTeardown(() => {
        deactivate();
    });
    return contex;
}