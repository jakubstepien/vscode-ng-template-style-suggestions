import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getDocumentForInlineStylesTests  } from '../test-utils';
import { LocalStylesProvider } from '../../../../providers/localStylesProvider';

const templatePosition = new vscode.Position(22, 14);

suite('CSS Inline component local class suggestions', () => {
	const contex = activateExtension();

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

	test('style url has imported class', async () => {
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('inline-component-local-imported-class'));
	});
});

async function getCompletitionItems(position: vscode.Position | null = null) {
	const doc = await  getDocumentForInlineStylesTests('**/src/app/inline-component/inline-component.component.ts', templatePosition);

	const provider = new LocalStylesProvider(doc, templatePosition);
	const items = await provider.getCompletitionItems();
	return items;
}
