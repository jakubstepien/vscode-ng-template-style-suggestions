import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { StyleSyntax } from '../../../../utils/common';
import { StylesToCompletitionItemsParser } from '../../../../parsers/stylesToCompletitionItemsParser';
import { activateExtension } from '../testUtils';
// import * as myExtension from '../../extension';

suite('StylesToCompletitionItemsParser Test Suite', () => {
    const context = activateExtension();

    test('less string to completition items', async () => {
        const less = `
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
        const parser = new StylesToCompletitionItemsParser();
        const items = await parser.getCompletitionItemsFromCode([less], StyleSyntax.less);

        assert.strictEqual(3, items.class.size);
        assert.strictEqual(1, items.id.size);
        assert.strictEqual(true, items.class.has('foo'));
        assert.strictEqual(true, items.class.has('bar'));
        assert.strictEqual(true, items.class.has('test'));
        assert.strictEqual(false, items.class.has('id'));
        assert.strictEqual(true, items.id.has('id'));
    });
});
