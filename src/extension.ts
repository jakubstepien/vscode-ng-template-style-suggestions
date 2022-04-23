import * as vscode from 'vscode';
import { globalStylesProvider } from './providers/globalStylesProvider';
import { TempDocumentContentProvider } from './documentContentProviders/tempDocumentContentProvider';
import { registerCommands, commands, registerConfigurationChangeEvents } from './configurationHelper';
import { angularConfigProvider } from './providers/angularConfigProvider';
import { isInputtingClass } from './parsers/inputPositionParser';
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

			return await activeDocumentStyleProvider.getCompletitionItems(document, position, 'class');
		}
	}));

	return context;
}

// this method is called when your extension is deactivated
export function deactivate() {
	globalStylesProvider?.dispose();
	activeDocumentStyleProvider?.dispose();
	angularConfigProvider?.dispose();
}
