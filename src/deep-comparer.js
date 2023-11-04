const performanceLogger = require('./utils/performance-logger');
const { hashCompare } = require('./utils/hash-compare');
const { DiffType, DEFAULT_ROOT } = require('./constants');
const { getChangelog } = require('./utils/get-changelog');
const Helper = require('./utils/helper');

/**
 * @author: davic. Github: https://github.com/DavideCometa
 * Creates a deep comparer function that can be used to compare two versions of an object or array.
 *
 * @param {string[]} [keysToIgnore] - An optional array of keys to ignore during the comparison.
 * @param {string[]} [keysToFilter] - An optional array of keys to filter out from the output.
 * @returns {Function} A deep compare function that takes two versions of an object or array (first passed param
 *                      will be considered the prior version), and an optional path parameter to be used as root in the report.
 *
 * @example
 * const deepCompare = createDeepComparer(['keyToIgnore'], ['keyToHide']);
 * const diffs = await deepCompare({ a: 1, b: 2 }, { a: 1, b: 3 });
 * console.log(diffs);
 */
function createDeepComparer(keysToIgnore, keysToFilter) {
	/**
	 * Recursively compares two elements and returns a detailed changelog.
	 *
	 * @param {Object} prior - The original data.
	 * @param {Object} latest - The updated data.
	 * @param {string} path - The current path being compared.
	 * @returns {Object[]} An array of diffs between the two.
	 */
	async function deepObjectCompare(prior, latest, path) {
		if (hashCompare(prior, latest)) return [];

		const comparePromises = Object.entries(prior).map(async ([key, value]) => {
			if (keysToIgnore && keysToIgnore.includes(key)) return [];

			const currentPath = `${path}.${key}`;
			const diffs = [];
			const latestVal = latest[key];

			if (typeof value === 'function' || typeof latestVal === 'function') {
				throw new Error(`Function found at ${currentPath}`);
			}

			if (latestVal == null) {
				diffs.push(
					getChangelog(value, undefined, currentPath, DiffType.Deleted, keysToFilter)
				);
			} else if (Helper.areBothArrays(value, latestVal)) {
				diffs.push(...(await deepArrayCompare(value, latestVal, currentPath)));
			} else if (Helper.areBothObjects(value, latestVal)) {
				diffs.push(...(await deepObjectCompare(value, latestVal, currentPath)));
			} else if (value !== latestVal) {
				diffs.push(
					getChangelog(value, latestVal, currentPath, DiffType.Updated, keysToFilter)
				);
			}

			return diffs;
		});

		const nestedDiffs = await Promise.all(comparePromises);
		const flattenedDiffs = nestedDiffs.flat();

		// Check for newly added keys
		return Object.entries(latest).reduce((diffs, [key, value]) => {
			if (!Object.prototype.hasOwnProperty.call(prior, key)) {
				const currentPath = `${path}.${key}`;
				diffs.push(
					getChangelog(value, undefined, currentPath, DiffType.Added, keysToFilter)
				);
			}
			return diffs;
		}, flattenedDiffs);
	}

	/**
	 * Recursively compares two arrays and returns a detailed changelog.
	 *
	 * @param {Array} prior - The original array.
	 * @param {Array} latest - The updated array.
	 * @param {string} path - The current path being compared.
	 * @returns {Object[]} An array of diffs between the two.
	 */
	async function deepArrayCompare(prior, latest, path) {
		if (hashCompare(prior, latest)) return [];

		const comparePromises = prior.map(async (elem, i) => {
			const currentPath = `${path}[${i}]`;
			const diffs = [];
			const latestElem = latest[i];

			if (typeof elem === 'function' || typeof latestElem === 'function') {
				throw new Error(`Function found at ${currentPath}`);
			}

			if (latest.length <= i) {
				diffs.push(
					getChangelog(elem, undefined, currentPath, DiffType.Deleted, keysToFilter)
				);
			} else if (Helper.areBothArrays(elem, latestElem)) {
				diffs.push(...(await deepArrayCompare(elem, latestElem, currentPath)));
			} else if (Helper.areBothObjects(elem, latestElem)) {
				diffs.push(...(await deepObjectCompare(elem, latestElem, currentPath)));
			} else if (elem !== latestElem) {
				diffs.push(
					getChangelog(elem, latestElem, currentPath, DiffType.Updated, keysToFilter)
				);
			}

			return diffs;
		});

		const nestedDiffs = await Promise.all(comparePromises);
		const flattenedDiffs = nestedDiffs.flat();

		// Check for newly added elements
		return latest.slice(prior.length).reduce((diffs, elem, i) => {
			const currPath = `${path}[${i + prior.length}]`;
			diffs.push(
				getChangelog(elem, undefined, currPath, DiffType.Added, keysToFilter)
			);
			return diffs;
		}, flattenedDiffs);
	}

	/**
	 * Deeply compares two versions of an object or array and returns a detailed changelog.
	 *
	 * @param {Object|Array} prior - The original or older version.
	 * @param {Object|Array} latest - The updated version.
	 * @param {string} [path='root'] - The starting path to report changelogs.
	 * @returns {Object[]} An array of diffs between the two versions.
	 *
	 * @throws {Error} If either `prior` or `latest` is null or undefined.
	 */
	return async function deepCompare(prior, latest, root = DEFAULT_ROOT) {
		const startTime = process.hrtime();
		const diffs = [];

		if (!prior || !latest)
			throw new Error(
				'Two non-null versions must be provided for the deep compare.'
			);

		// Compute hashes for both versions, if they equal no further compare
		if (hashCompare(prior, latest)) return [];

		if (Helper.areBothArrays(prior, latest)) {
			diffs.push(...(await deepArrayCompare(prior, latest, root)));
		} else if (Helper.areBothObjects(prior, latest)) {
			diffs.push(...(await deepObjectCompare(prior, latest, root)));
		} else {
			diffs.push(
				getChangelog(prior, latest, root, DiffType.Updated, keysToFilter)
			);
		}

		performanceLogger.log('Execution Time: ', process.hrtime(startTime));

		return diffs;
	};
}

module.exports = { createDeepComparer, DiffType };
