const { DiffType } = require('../constants');
const { filterObjectKeys } = require('./filter-object-keys');

function getChangelog(prior, latest, path, diffType, keysToFilter) {
	const result = { path };
	switch (diffType) {
		case DiffType.Deleted:
			return {
				...result,
				oldVal: filterObjectKeys(prior, keysToFilter),
				note: DiffType.Deleted.description,
			};
		case DiffType.Updated:
			return {
				...result,
				oldVal: filterObjectKeys(prior, keysToFilter),
				newVal: filterObjectKeys(latest, keysToFilter),
				note: DiffType.Updated.description,
			};
		case DiffType.Added:
			return {
				...result,
				newVal: filterObjectKeys(prior, keysToFilter),
				note: DiffType.Added.description,
			};
		default:
			throw new Error(`Unknown diffType: ${diffType}`);
	}
}

module.exports = { getChangelog };
