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

export function waitForAngularLanguageService(){
    suiteSetup(async () => {
		const angLS = vscode.extensions.getExtension('angular.ng-template');
		await angLS?.activate;

		// waiting some time for angular language service to start
		// todo find some way to check if it's loaded
		await new Promise(res => {
			setTimeout(() => {
				res(true);	
			},10000);
		});
	});
}