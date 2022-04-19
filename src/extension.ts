import * as vscode from 'vscode';
import { globalCssProvider } from './providers/global-css-provider';
import { TempDocumentContentProvider } from './document-content-providers/temp-document-content-provider';
import { registerCommands, commands, registerConfigurationChangeEvents } from './configurationHelper';
import { angularConfigProvider } from './providers/angular-config-provider';
import { isInputtingClass } from './parsers/input-position-parser';
import { activeDocumentStyleProvider } from './providers/activeDocumentStyleProvider';


export function activate(context: vscode.ExtensionContext) {
	TempDocumentContentProvider.register(context);
	registerCommands(context);
	registerConfigurationChangeEvents(context);

	commands.resetCache.invoke();

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('html', {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const lineStart = new vscode.Position(position.line, 0);
			const range = new vscode.Range(lineStart, position);
			const text = document.getText(range);
			if (isInputtingClass(text) === false) {
				return [];
			}

			return await activeDocumentStyleProvider.getCompletitionItems(document, position);
		}
	}));

	return context;
}

// this method is called when your extension is deactivated
export function deactivate() {
	globalCssProvider?.dispose();
	activeDocumentStyleProvider?.dispose();
	angularConfigProvider?.dispose();
}
