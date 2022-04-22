import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, resetGlobalStyles, setGlobalStyle, setOtherGlobalStyle } from '../test-utils';
import { LocalStylesProvider } from '../../../../providers/localStylesProvider';
import { globalStylesProvider } from '../../../../providers/globalStylesprovider';
import { extensionString, ignorePathsForSuggestions } from '../../../../configurationHelper';

suite('CSS Regular component global class suggestions', () => {
	const contex = activateExtension();

	test('global style classes', async () => {
		await setGlobalStyle(`
			.global-class {
				color: red;
			}
		`);
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('global-class'));
	});

	test('global style import other file', async () => {
		await setOtherGlobalStyle(`
			.global-imported-class {
				color: red;
			}
		`);
		await setGlobalStyle(`
			@import './other-global-style.css';
			.global-class {
				color: red;
			}
		`);
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('global-class'));
		assert.strictEqual(true, items.has('global-imported-class'));
	});

	test('global style import skips ignored path', async () => {
		const opt = await vscode.workspace.getConfiguration(extensionString)
		await opt.update(ignorePathsForSuggestions, [
			{regex: 'bootstrap', flags: []},
		]);
		
		await setGlobalStyle(`
			@import "../node_modules/bootstrap/scss/bootstrap.scss";
			.global-class {
				color: red;
			}
		`);

		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('global-class'));
		assert.strictEqual(false, items.has('btn-danger'));
	});

	
	test('global style import imports css file', async () => {
		await setGlobalStyle(`
			@import "../node_modules/bootstrap/dist/css/bootstrap.css";
			@import "temp";
			.global-class {
				color: red;
			}
		`);

		const items = await getCompletitionItems();
		assert.strictEqual(true, items.has('global-class'));
		assert.strictEqual(true, items.has('btn-danger'));
	});

	teardown(async () => {
		await resetGlobalStyles();
	});
});

async function getCompletitionItems() {
	const files = await vscode.workspace.findFiles('**/src/app/regular-component/regular-component.component.html');
	assert.strictEqual(1, files.length);

	const doc = await vscode.workspace.openTextDocument(files[0]);
	const position = new vscode.Position(0, 0);
	const items = await globalStylesProvider.getGlobalCompletitionItems();
	return items;
}

