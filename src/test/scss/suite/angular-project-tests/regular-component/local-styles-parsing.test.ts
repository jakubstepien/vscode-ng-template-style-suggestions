import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension } from '../../test-utils';
import { LocalCssProvider } from '../../../../../providers/local-css-provider';

suite('Regular component local class suggestions', () => {
	const contex = activateExtension();

	test('regular component inline style class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('regular-component-inline-class'));
	});

	test('regular component style url classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('regular-component-class'));
		assert.strictEqual(true, items.has('regular-component-another-decorator-url-class'));
	});

	test('regular component style url has nested classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('regular-component-nested-class'));
	});

	test('regular component style url has dynamic classes', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('regular-component-dynamic-class-1'));
		assert.strictEqual(true, items.has('regular-component-dynamic-class-2'));
	});

	test('regular component style url has imported class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('regular-component-local-imported-class'));
	});
});

async function getCompletitionItems() {
	const files = await vscode.workspace.findFiles('**/src/app/regular-component/regular-component.component.html');
	assert.strictEqual(1, files.length);

	const doc = await vscode.workspace.openTextDocument(files[0]);
	const position = new vscode.Position(0, 0);
	const provider = new LocalCssProvider(doc, position);
	const items = await provider.getCompletitionItems();
	return items;
}

