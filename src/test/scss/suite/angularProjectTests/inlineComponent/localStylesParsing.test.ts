import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, waitForAngularLanguageService } from '../../test-utils';
import { LocalStylesProvider } from '../../../../../providers/localStylesProvider';

const templatePosition = new vscode.Position(22, 14);

suite('SCSS Inline component local class suggestions', () => {
	const contex = activateExtension();
	
	waitForAngularLanguageService();

	test('position not in template', async () => {
		const items = await getCompletitionItems(new vscode.Position(0, 0));
		assert.strictEqual(false, items.has('inline-component-inline-class'));
	});

	test('does not suggest style from other inline component', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(false, items.has('inline-component-class-other-one'));
	});

	test('inline style class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-inline-class'));
	});

	test('style url classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-class'));
		assert.strictEqual(true, items.has('inline-component-another-decorator-url-class'));
	});

	test('style url has nested classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-nested-class'));
	});

	test('style url has dynamic classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-dynamic-class-1'));
		assert.strictEqual(true, items.has('inline-component-dynamic-class-2'));
	});

	test('style url has imported class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-local-imported-class'));
	});
});

async function getCompletitionItems(position: vscode.Position | null = null) {
	const files = await vscode.workspace.findFiles('**/src/app/inline-component/inline-component.component.ts');
	assert.strictEqual(1, files.length);

	const originalDoc = await vscode.workspace.openTextDocument(files[0]);
	const originalUri = originalDoc.uri.toString();

	//without this vscode wont find angular-embedded-content
	await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', originalDoc.uri, templatePosition);

	const vdocUri = vscode.Uri.file(encodeURIComponent(originalUri) + '.html')
		.with({scheme: 'angular-embedded-content', authority: 'html'});

	const doc = await vscode.workspace.openTextDocument(vdocUri);
	if(position == null){
		position = templatePosition;
	}
	const provider = new LocalStylesProvider(doc, position);
	const items = await provider.getCompletitionItems();
	return items;
}

