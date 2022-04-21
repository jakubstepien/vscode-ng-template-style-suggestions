import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { isInputtingClass } from '../../../parsers/inputPositionParser';
// import * as myExtension from '../../extension';

suite('isInputtingClass Test Suite', () => {
	suite('non bound attributes', () => {
		test('matches non bound class attributes', () => {
			assert.strictEqual(false, isInputtingClass("class=\"\""));
	
			assert.strictEqual(true, isInputtingClass("class=\""));
			assert.strictEqual(true, isInputtingClass("class=\"some-text"));
		});
	});
	
	suite('bound class attribute', () => {
		test('empty and finished', () => {
			assert.strictEqual(false, isInputtingClass("[class]=\"\""));
		});
	
		test('not finished but string not started - can be any oth{er expression', () => {
			assert.strictEqual(false, isInputtingClass("[class]=\""));
		});
	
		test('string started', () => {
			assert.strictEqual(true, isInputtingClass("[class]=\"'"));
			assert.strictEqual(true, isInputtingClass("[class]=\"'some-class"));
		});
	
		test('string ended to be followed with some other expression', () => {
			assert.strictEqual(false, isInputtingClass("[class]=\"'some-class'"));
			assert.strictEqual(false, isInputtingClass("[class]=\"'some-class ' + txt"));
		});
		test('new string expression started', () => {
			assert.strictEqual(true, isInputtingClass("[class]=\"'some-class ' + txt + '"));
		});
	});
	
	suite('bound ngClass attribute', () => {
		test('empty and finished', () => {
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"\""));
		});
	
		test('not finished but string not started - can be any other expression', () => {
			assert.strictEqual(false, isInputtingClass("[ngClass]=\""));
		});
	
		test('string started', () => {
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"'"));
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"'some-class"));
		});
	
		test('string ended to be followed with some other expression', () => {
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"'some-class'"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"'some-class ' + txt"));
		});
	
		test('new string expression started', () => {
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"'some-class ' + txt + '"));
		});
	
		test('in array', () => {
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"['"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"['first'"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"['first']"));
	
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"['first', '"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"['first', 'second'"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"['first', 'second]'"));
		});
	
		test('object syntax', () => {
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"{'"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"{'first': "));
			
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"{'first': true, 'second "));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"{'first': true, 'second': false"));
			assert.strictEqual(false, isInputtingClass("[ngClass]=\"{'first': true, 'second': false}"));
	
			assert.strictEqual(true, isInputtingClass("[ngClass]=\"{'first': true, 'second': true, 'third fourth "));
		});
	});
});
