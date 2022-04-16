import * as vscode from 'vscode';
import { globalCssProvider } from './providers/global-css-provider';
import { TempDocumentContentProvider } from './document-content-providers/temp-document-content-provider';
import { LocalCssProvider } from './providers/local-css-provider';
import { addMaps } from './utils/common';
import { registerCommands, commands, registerConfigurationChangeEvents } from './commands';
import { angularConfigProvider } from './providers/angular-config-provider';

function isInClassAttribute(document: vscode.TextDocument, position: vscode.Position) {
	const lineStart = new vscode.Position(position.line, 0);
	const range = new vscode.Range(lineStart, position);
	const text = document.getText(range);
	return text.match(/class="[^"]*$/) !== null;
}

export function activate(context: vscode.ExtensionContext) {
	TempDocumentContentProvider.register(context);
	registerCommands(context);
	registerConfigurationChangeEvents(context);

	commands.resetCache.invoke();

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('html', {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			if (isInClassAttribute(document, position) === false) {
				return [];
			}

			const globalCompletitionItems = await globalCssProvider.getGlobalCompletitionItems();
			const localCompletitionItems = await new LocalCssProvider(document, position).getCompletitionItems();

			const allItems = addMaps(localCompletitionItems, globalCompletitionItems, true);
			return Array.from(allItems).map(x => x[1]);
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
	globalCssProvider?.dispose();
	angularConfigProvider?.dispose();
}
