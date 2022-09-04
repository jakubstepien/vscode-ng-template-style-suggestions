import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension } from '../testUtils';
import { LocalStylesProvider } from '../../../../providers/styles/localStylesProvider';

suite('SASS Regular component local class suggestions', () => {
	const context = activateExtension();

	test('inline style class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('regular-component-inline-class'));
	});

	test('style url classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('regular-component-class'));
		assert.strictEqual(true, items.class.has('regular-component-another-decorator-url-class'));
	});

	test('style url has nested classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('regular-component-nested-class'));
	});

	test('style url has dynamic classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('regular-component-dynamic-class-1'));
		assert.strictEqual(true, items.class.has('regular-component-dynamic-class-2'));
	});

	test('style url has imported class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('regular-component-local-imported-class'));
	});
});

async function getCompletitionItems() {
	const files = await vscode.workspace.findFiles('**/src/app/regular-component/regular-component.component.html');
	assert.strictEqual(1, files.length);

	const doc = await vscode.workspace.openTextDocument(files[0]);
	const position = new vscode.Position(0, 0);
	const provider = new LocalStylesProvider(doc, position);
	const items = await provider.getCompletitionItems();
	return items;
}

