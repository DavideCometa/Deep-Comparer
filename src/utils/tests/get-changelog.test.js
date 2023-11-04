const assert = require('chai').assert;
const { getChangelog } = require('../get-changelog');
const { DiffType } = require('../../constants');

describe('getChangelog function', function () {
	it('should throw an error for unknown diffType', function () {
		const invalidType = 'invalidType';

		assert.throws(
			() => getChangelog({}, {}, 'root', invalidType, []),
			Error,
			'Unknown diffType: invalidType'
		);
	});

	it('should handle DiffTypes correctly', function () {
		const result = getChangelog({ a: 1 }, { a: 2 }, 'root', DiffType.Updated, []);
		assert.deepEqual(result, {
			path: 'root',
			oldVal: { a: 1 },
			newVal: { a: 2 },
			note: DiffType.Updated.description,
		});
	});
});
