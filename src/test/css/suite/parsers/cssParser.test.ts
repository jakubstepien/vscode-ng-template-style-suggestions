import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { StyleSyntax } from '../../../../common';
import { StylesToCompletitionItemsParser } from '../../../../parsers/stylesToCompletitionItemsParser';
import { activateExtension } from '../test-utils';
// import * as myExtension from '../../extension';

suite('cssFileToCompletionItemsParser Test Suite', () => {
    const contex = activateExtension();

    test('css string to completition items', async () => {
        const css = `
			.foo {
				border: 1px solid red;
			}

            #id {
                color: red;
            }

			.test {
				display: flex;
			}
		`;
        const parser = new StylesToCompletitionItemsParser();
        const items = await parser.getCompletitionItemsFromCode([css], StyleSyntax.css);

        assert.strictEqual(2, items.class.size);
        assert.strictEqual(1, items.id.size);
        assert.strictEqual(true, items.class.has('foo'));
        assert.strictEqual(true, items.class.has('test'));
        assert.strictEqual(false, items.class.has('id'));
        assert.strictEqual(true, items.id.has('id'));
    });
});
