const assert = require('chai').assert;
const { computeHash, hashCompare } = require('../hash-compare');

describe('Hash Compare Utils', () => {
	describe('computeHash()', () => {
		it('should compute a SHA-256 hash of an object', () => {
			const data = { a: 1, b: 2 };
			const expectedHash =
				'43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777';
			assert.strictEqual(computeHash(data), expectedHash);
		});

		it('should compute a SHA-256 hash of an array', () => {
			const data = [1, 2, 3];
			const expectedHash =
				'a615eeaee21de5179de080de8c3052c8da901138406ba71c38c032845f7d54f4';
			assert.strictEqual(computeHash(data), expectedHash);
		});
	});

	describe('hashCompare()', () => {
		it('should return true for identical objects', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 2 };
			assert.isTrue(hashCompare(obj1, obj2));
		});

		it('should return true for identical arrays', () => {
			const arr1 = [1, 2, 3];
			const arr2 = [1, 2, 3];
			assert.isTrue(hashCompare(arr1, arr2));
		});

		it('should return false for different objects', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 3 };
			assert.isFalse(hashCompare(obj1, obj2));
		});

		it('should return false for different arrays', () => {
			const arr1 = [1, 2, 3];
			const arr2 = [1, 2, 4];
			assert.isFalse(hashCompare(arr1, arr2));
		});
	});
});
