import * as vscode from 'vscode';
import { globalStylesProvider } from './providers/styles/globalStylesProvider';
import { TempDocumentContentProvider } from './documentContentProviders/tempDocumentContentProvider';
import { angularConfigProvider } from './providers/angularConfigProvider';
import { getInputtingSymbol } from './parsers/inputPositionParser';
import { activeDocumentStyleProvider } from './providers/styles/activeDocumentStyleProvider';
import { styleDocumentLinkProvider } from './providers/links/styleDocumentLinkProvider';
import { extensionCommands, registerCommands } from './utils/configuration/commandsHelper';
import { registerConfigurationChangeEvents } from './utils/configuration/configurationHelper';
import { styleLinkProviderManager } from './styleLinkProviderManager';

export function activate(context: vscode.ExtensionContext) {
	TempDocumentContentProvider.register(context);
	registerCommands(context);
	registerConfigurationChangeEvents(context);

	extensionCommands.resetCache.invoke();

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('html', {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const lineStart = new vscode.Position(position.line, 0);
			const range = new vscode.Range(lineStart, position);
			const text = document.getText(range);

			const symbolToSuggest = getInputtingSymbol(text);
			if (symbolToSuggest == null) {
				return [];
			}

			return await activeDocumentStyleProvider.getCompletitionItems(document, position, symbolToSuggest);
		}
	}));

	styleLinkProviderManager.init(context);
	return context;
}

// this method is called when your extension is deactivated
export function deactivate() {
	globalStylesProvider?.dispose();
	activeDocumentStyleProvider?.dispose();
	angularConfigProvider?.dispose();
	styleDocumentLinkProvider?.dispose();
}
