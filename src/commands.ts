import * as vscode from 'vscode';
import { globalCssProvider } from './providers/global-css-provider';

const commandPrefix = 'angular-sass-sugggestions';

class Command<TArg> {
    constructor(private command: string, private callback: (arg: TArg) => any, thisArg?: any) {
    }

    public invoke(arg: TArg) {
        vscode.commands.executeCommand(this.command, arg);
    }

    public register() {
        return vscode.commands.registerCommand(this.command, this.callback);
    }
}

export const commands = {
    resetCache: new Command<void>(`${commandPrefix}.reset-cache`, () => globalCssProvider.init())
};

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(commands.resetCache.register());
}