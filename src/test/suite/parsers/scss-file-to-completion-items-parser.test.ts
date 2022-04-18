import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { deactivate } from '../../../extension';
import { SassFileToCompletionItemsParser } from '../../../parsers/scss-file-to-completion-items-parser';
// import * as myExtension from '../../extension';

suite('SassFileToCompletionItemsParser Test Suite', () => {
    let contex: vscode.ExtensionContext | null = null;
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension("jakubstepien.vscode-angular-sass-suggestions");
        contex = await ext?.activate() as unknown as vscode.ExtensionContext;
    });

    suiteTeardown(() => {
        deactivate();
    });

    test('scss string to completition items', async () => {
        const scss = `
			.foo {
				border: 1px solid red;

				.bar {
					color: yellow;
				}

				#id {
					color: blue;
				}
			}

			.test {
				display: flex;
			}
		`;
        const parser = new SassFileToCompletionItemsParser();
        const items = await parser.getCompletitionItemsCode([scss]);

        assert.strictEqual(3, items.size);
        assert.strictEqual(true, items.has('foo'));
        assert.strictEqual(true, items.has('bar'));
        assert.strictEqual(true, items.has('test'));
        assert.strictEqual(false, items.has('id'));
    });
});
