import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, resetGlobalStyles, setGlobalStyle, setOtherGlobalStyle } from '../testUtils';
import { LocalStylesProvider } from '../../../../providers/styles/localStylesProvider';
import { globalStylesProvider } from '../../../../providers/styles/globalStylesProvider';
import { extensionString, globalStylesSuggestions, ignorePathsForSuggestions } from '../../../../utils/configuration/constants';

suite('CSS Regular component global class suggestions', () => {
	const context = activateExtension();

	test('global style classes', async () => {
		await setGlobalStyle(`
			.global-class {
				color: red;
			}
		`);
		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('global-class'));
	});

	test('global style suggestions disabled returns empty', async () => {
		const opt = vscode.workspace.getConfiguration(extensionString);
		await opt.update(globalStylesSuggestions, false);

		await setGlobalStyle(`
			.global-class {
				color: red;
			}
		`);
		const items = await getCompletitionItems();
		assert.strictEqual(0, items.class.size);
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

		await new Promise(res => {
			setTimeout(() => res(true), 3000);
		});

		assert.strictEqual(true, items.class.has('global-class'));
		assert.strictEqual(true, items.class.has('global-imported-class'));
	});

	test('global style import skips ignored path', async () => {
		const opt = await vscode.workspace.getConfiguration(extensionString)
		await opt.update(ignorePathsForSuggestions, [
			{regex: 'other', flags: []},
		]);
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
		assert.strictEqual(true, items.class.has('global-class'));
		assert.strictEqual(false, items.class.has('global-imported-class'));
	});


	test('global style import imports css file', async () => {
		await setGlobalStyle(`
			@import "../node_modules/bootstrap/dist/css/bootstrap.css";
			.global-class {
				color: red;
			}
		`);

		const items = await getCompletitionItems();
		assert.strictEqual(true, items.class.has('global-class'));
		assert.strictEqual(true, items.class.has('btn-danger'));
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

