const assert = require('assert');
const { createDeepComparer, DiffType } = require('../deep-comparer');

describe('deep-comparator', () => {
	describe('Error handling', () => {
		it('should throw in case of null or undefined elements to compare', async () => {
			const deepCompare = createDeepComparer();

			await assert.rejects(
				async () => {
					await deepCompare(undefined, null);
				},
				(err) => {
					assert(err instanceof Error);
					assert.strictEqual(
						err.message,
						'Two non-null versions must be provided for the deep compare.'
					);
					return true;
				}
			);
		});

		it('should throw an error when comparing functions in arrays', async () => {
			const prior = {
				key1: {
					subKey1: [() => {}],
				},
			};
			const latest = {
				key1: {
					subKey1: ['function () {}'],
				},
			};

			const deepCompare = createDeepComparer();
			await assert.rejects(
				async () => {
					await deepCompare(prior, latest);
				},
				(err) => {
					assert(err instanceof Error);
					assert.strictEqual(err.message, 'Function found at root.key1.subKey1[0]');
					return true;
				}
			);
		});

		it('should throw an error when comparing functions in objects', async () => {
			const prior = {
				key1: {
					subKey1: () => {},
				},
			};
			const latest = {
				key1: {
					subKey1: '() => {}',
				},
			};

			const deepCompare = createDeepComparer();
			await assert.rejects(
				async () => {
					await deepCompare(prior, latest);
				},
				(err) => {
					assert(err instanceof Error);
					assert.strictEqual(err.message, 'Function found at root.key1.subKey1');
					return true;
				}
			);
		});
	});

	describe('Primitive Types', () => {
		it('should report changes between primitive data types', async () => {
			const prior = 3;
			const latest = 'string';
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), [
				{
					path: 'root',
					newVal: 'string',
					note: 'Updated',
					oldVal: 3,
				},
			]);
		});
	});

	describe('Arrays', () => {
		it('should report updates between simple arrays', async () => {
			const elem1 = [1, 2, 3];
			const elem2 = [1, 2, 4];
			const expected = [
				{
					path: 'root[2]',
					oldVal: 3,
					newVal: 4,
					note: DiffType.Updated.description,
				},
			];

			const deepCompare = createDeepComparer();

			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should notice additions in simple arrays', async () => {
			const elem1 = [1, 2, 3];
			const elem2 = [1, 2, 3, 6];
			const expected = [
				{
					path: 'root[3]',
					newVal: 6,
					note: DiffType.Added.description,
				},
			];

			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should notice deletions in simple arrays', async () => {
			const elem1 = [1, 2, 3];
			const elem2 = [1, 2];
			const expected = [
				{
					path: 'root[2]',
					oldVal: 3,
					note: DiffType.Deleted.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should compare nested arrays and report diffs', async () => {
			const prior = [[]];
			const latest = [[1]];
			const expectedDiff = [
				{
					path: 'root[0][0]',
					newVal: 1,
					note: DiffType.Added.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), expectedDiff);
		});

		it('should report an update from object to string in arrays', async () => {
			const prior = [{ a: 1 }];
			const latest = ['not an object'];
			const expectedDiff = [
				{
					path: 'root[0]',
					oldVal: { a: 1 },
					newVal: 'not an object',
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), expectedDiff);
		});
	});

	describe('Objects', () => {
		it('should report no diffs in case of no changes', async () => {
			const elem = {
				a: 1,
				b: [1, 2, { f: 5, g: [] }],
				c: { d: 3 },
			};
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem, elem), []);
		});

		it('should notice updates in simple objects', async () => {
			const elem1 = { a: 1, b: 2, c: 3 };
			const elem2 = { a: 1, b: 2, c: 4 };
			const expected = [
				{
					path: 'root.c',
					oldVal: 3,
					newVal: 4,
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should notice additions in simple objects', async () => {
			const elem1 = { a: 1, b: 2, c: 3 };
			const elem2 = { a: 1, b: 2, c: 3, d: 4 };
			const expected = [
				{
					path: 'root.d',
					newVal: 4,
					note: DiffType.Added.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should notice deletions in simple objects', async () => {
			const elem1 = { a: 1, b: 2, c: 3 };
			const elem2 = { a: 1, b: 2 };
			const expected = [
				{
					path: 'root.c',
					oldVal: 3,
					note: DiffType.Deleted.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should detect changes in objects with Date instances', async () => {
			const date1 = new Date(2020, 0, 1);
			const date2 = new Date(2021, 0, 1);
			const elem1 = { a: 1, b: date1 };
			const elem2 = { a: 1, b: date2 };
			const expected = [
				{
					path: 'root.b',
					oldVal: date1,
					newVal: date2,
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});
	});

	describe('Complex Objects', () => {
		it('should compare complex nested objects', async () => {
			const elem1 = {
				a: 1,
				b: [1, 2, { f: 5, g: [] }],
				c: { d: 3 },
			};
			const elem2 = {
				b: [1, 2, { f: 5, g: [5, 7] }],
				c: { d: 'test', e: 'test2' },
			};
			const expected = [
				{
					path: 'root.a',
					oldVal: 1,
					note: DiffType.Deleted.description,
				},
				{
					path: 'root.b[2].g[0]',
					newVal: 5,
					note: DiffType.Added.description,
				},
				{
					path: 'root.b[2].g[1]',
					newVal: 7,
					note: DiffType.Added.description,
				},
				{
					path: 'root.c.d',
					oldVal: 3,
					newVal: 'test',
					note: DiffType.Updated.description,
				},
				{
					path: 'root.c.e',
					newVal: 'test2',
					note: DiffType.Added.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should report an update from array to string inside an object', async () => {
			const prior = {
				key1: [1, 2, 3],
			};
			const latest = {
				key1: 'not an array',
			};
			const expectedDiff = [
				{
					path: 'root.key1',
					oldVal: [1, 2, 3],
					newVal: 'not an array',
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), expectedDiff);
		});

		it('should report an update from object to string', async () => {
			const prior = {
				key1: {
					subKey1: 'value1',
				},
			};
			const latest = {
				key1: 'not an object',
			};
			const expectedDiff = [
				{
					path: 'root.key1',
					oldVal: {
						subKey1: 'value1',
					},
					newVal: 'not an object',
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), expectedDiff);
		});

		it('should report an update from array to string as an element of another array', async () => {
			const prior = [[]];
			const latest = ['not an array'];
			const expectedDiff = [
				{
					path: 'root[0]',
					oldVal: [],
					newVal: 'not an array',
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer();
			assert.deepStrictEqual(await deepCompare(prior, latest), expectedDiff);
		});
	});

	describe('Ignore keys from comparison or hide sensible data in changelog', () => {
		it('should ignore specified keys from the comparison', async () => {
			const elem1 = { a: 1, b: 2, c: 3 };
			const elem2 = { a: 1, b: 2, c: 4 };
			const keysToIgnore = ['c'];
			const expected = [];
			const deepCompare = createDeepComparer(keysToIgnore);
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should format the output hiding selected fields', async () => {
			const elem1 = {
				b: [1, 2, { f: 5, g: [] }],
				c: { d: 3 },
				e: { h: 2 },
			};
			const elem2 = {
				b: [1, 2, { f: 5, g: [] }],
				c: { d: { h: 9, i: 8 } },
				e: { h: 2 },
			};
			const keysToHide = ['i', 'g'];
			const expected = [
				{
					path: 'root.c.d',
					oldVal: 3,
					newVal: { h: 9 },
					note: DiffType.Updated.description,
				},
			];
			const deepCompare = createDeepComparer(undefined, keysToHide);
			assert.deepStrictEqual(await deepCompare(elem1, elem2), expected);
		});

		it('should hide a given field when reporting updates inside arrays', async () => {
			const prior = { arrayField: [1, 2, { a: 1 }] };
			const latest = { arrayField: [1, 2, { a: [2, 5, { toHide: 3 }] }] };
			const keysToHide = ['toHide'];
			const deepCompare = createDeepComparer(undefined, keysToHide);
			assert.deepStrictEqual(await deepCompare(prior, latest), [
				{
					path: 'root.arrayField[2].a',
					oldVal: 1,
					newVal: [2, 5, {}],
					note: DiffType.Updated.description,
				},
			]);
		});
	});
});
