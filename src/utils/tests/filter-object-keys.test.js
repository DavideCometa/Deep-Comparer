const assert = require('chai').assert;
const { filterObjectKeys } = require('../filter-object-keys');

describe('filterObjectKeys function', () => {
	it('should return the object unchanged if keysToFilter is not provided', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = filterObjectKeys(obj);
		assert.deepEqual(result, obj);
	});

	it('should return the object unchanged if keysToFilter is empty', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = filterObjectKeys(obj, []);
		assert.deepEqual(result, obj);
	});

	it('should filter keys from the object', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const keysToFilter = ['a', 'c'];
		const result = filterObjectKeys(obj, keysToFilter);
		assert.deepEqual(result, { b: 2 });
	});

	it('should filter keys from nested objects', () => {
		const obj = { a: { d: 4, e: 5 }, b: 2, c: { f: 6, g: 7 } };
		const keysToFilter = ['d', 'f'];
		const result = filterObjectKeys(obj, keysToFilter);
		assert.deepEqual(result, { a: { e: 5 }, b: 2, c: { g: 7 } });
	});

	it('should filter keys from objects within an array', () => {
		const arr = [
			{ a: 1, b: 2 },
			{ a: 3, b: 4 },
			{ a: 5, b: 6 },
		];
		const keysToFilter = ['a'];
		const result = filterObjectKeys(arr, keysToFilter);
		assert.deepEqual(result, [{ b: 2 }, { b: 4 }, { b: 6 }]);
	});

	it('should handle arrays with mixed types', () => {
		const arr = [{ a: 1, b: 2 }, 'string', 3, { a: 4, b: 5 }];
		const keysToFilter = ['a'];
		const result = filterObjectKeys(arr, keysToFilter);
		assert.deepEqual(result, [{ b: 2 }, 'string', 3, { b: 5 }]);
	});
});
