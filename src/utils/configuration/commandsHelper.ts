import * as vscode from 'vscode';

import { angularConfigProvider } from "../../providers/angularConfigProvider";
import { activeDocumentStyleProvider } from "../../providers/styles/activeDocumentStyleProvider";
import { globalStylesProvider } from "../../providers/styles/globalStylesProvider";
import { extensionString, resetCacheCommand, projectConfigurationName, cacheActiveEditorSuggestions } from "./constants";

class Command<TArg> {
    constructor(private command: string, private callback: (arg: TArg) => any, thisArg?: any) {
    }

    public invoke(arg: TArg) {
        return vscode.commands.executeCommand(this.command, arg);
    }

    public register() {
        return vscode.commands.registerCommand(this.command, this.callback);
    }
}

export const extensionCommands = {
    resetCache: new Command<void>(`${extensionString}.${resetCacheCommand}`, async () => {
        const config = vscode.workspace.getConfiguration(extensionString);
        const projectName = config.get(projectConfigurationName) as string;

        await angularConfigProvider.init(projectName);
        await globalStylesProvider.init();
        activeDocumentStyleProvider.init(config.get(cacheActiveEditorSuggestions) as boolean);
    })
};

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(extensionCommands.resetCache.register());
}