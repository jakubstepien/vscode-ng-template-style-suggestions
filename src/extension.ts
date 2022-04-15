import * as vscode from 'vscode';
import { GlobalCssProvider } from './providers/global-css-provider';
import { TempDocumentContentProvider } from './document-content-providers/temp-document-content-provider';

function isInClassAttribute(document: vscode.TextDocument, position: vscode.Position) {
	const lineStart = new vscode.Position(position.line, 0);
	const range = new vscode.Range(lineStart, position);
	const text = document.getText(range);
	return text.match(/class="[^"]*$/) !== null;
}

let globalCssProvider: GlobalCssProvider = null!;
export function activate(context: vscode.ExtensionContext) {
	TempDocumentContentProvider.register();
	globalCssProvider = new GlobalCssProvider();

	let disposable = vscode.languages.registerCompletionItemProvider('html', {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			if (isInClassAttribute(document, position) === false) {
				return [];
			}

			const globalClasses = await globalCssProvider.getGlobalCompletitionItems();
			return Array.from(globalClasses).map(x => x[1]);
		}
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
	globalCssProvider?.dispose();
}
