import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { getInputtingSymbol } from '../../../parsers/inputPositionParser';
// import * as myExtension from '../../extension';

suite('getInputtingSymbol Test Suite', () => {
	suite('non bound attributes', () => {
		test('matches non bound class attributes', () => {
			assert.strictEqual(null, getInputtingSymbol("class=\"\""));
	
			assert.strictEqual('class', getInputtingSymbol("class=\""));
			assert.strictEqual('class', getInputtingSymbol("class=\"some-text"));
		});
	});
	
	suite('bound class attribute', () => {
		test('empty and finished', () => {
			assert.strictEqual(null, getInputtingSymbol("[class]=\"\""));
		});
	
		test('not finished but string not started - can be any other expression', () => {
			assert.strictEqual(null, getInputtingSymbol("[class]=\""));
		});
	
		test('string started', () => {
			assert.strictEqual('class', getInputtingSymbol("[class]=\"'"));
			assert.strictEqual('class', getInputtingSymbol("[class]=\"'some-class"));
		});
	
		test('string ended to be followed with some other expression', () => {
			assert.strictEqual(null, getInputtingSymbol("[class]=\"'some-class'"));
			assert.strictEqual(null, getInputtingSymbol("[class]=\"'some-class ' + txt"));
		});
		test('new string expression started', () => {
			assert.strictEqual('class', getInputtingSymbol("[class]=\"'some-class ' + txt + '"));
		});
	});
	
	suite('bound ngClass attribute', () => {
		test('empty and finished', () => {
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"\""));
		});
	
		test('not finished but string not started - can be any other expression', () => {
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\""));
		});
	
		test('string started', () => {
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"'"));
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"'some-class"));
		});
	
		test('string ended to be followed with some other expression', () => {
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"'some-class'"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"'some-class ' + txt"));
		});
	
		test('new string expression started', () => {
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"'some-class ' + txt + '"));
		});
	
		test('in array', () => {
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"['"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"['first'"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"['first']"));
	
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"['first', '"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"['first', 'second'"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"['first', 'second]'"));
		});
	
		test('object syntax', () => {
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"{'"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"{'first': "));
			
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"{'first': 'class', 'second "));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"{'first': 'class', 'second': null"));
			assert.strictEqual(null, getInputtingSymbol("[ngClass]=\"{'first': 'class', 'second': null}"));
	
			assert.strictEqual('class', getInputtingSymbol("[ngClass]=\"{'first': 'class', 'second': 'class', 'third fourth "));
		});
	});

	suite('bound id attribute', () => {
		test('empty and finished', () => {
			assert.strictEqual(null, getInputtingSymbol("[id]=\"\""));
		});
	
		test('not finished but string not started - can be any other expression', () => {
			assert.strictEqual(null, getInputtingSymbol("[id]=\""));
		});
	
		test('string started', () => {
			assert.strictEqual('id', getInputtingSymbol("[id]=\"'"));
			assert.strictEqual('id', getInputtingSymbol("[id]=\"'some-id"));
		});
	});
});
