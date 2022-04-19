import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { deactivate } from '../../../../extension';
import { SassFileToCompletionItemsParser } from '../../../../parsers/scss-file-to-completion-items-parser';
import { activateExtension } from '../test-utils';
// import * as myExtension from '../../extension';

suite('SassFileToCompletionItemsParser Test Suite', () => {
    const contex = activateExtension();

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
