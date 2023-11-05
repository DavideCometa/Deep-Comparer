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
	 * Compares two values of any type and generates a changelog if they differ. It specifically handles
	 * Date objects by comparing their time values, arrays and objects by performing deep comparisons, and
	 * other value types by direct comparison. If a difference is detected, a changelog entry is created.
	 *
	 * @async
	 * @function compareValues
	 * @param {*} value1 - The first value to be compared.
	 * @param {*} value2 - The second value to be compared.
	 * @param {string} path - The path to the current value in the object, used for changelog entries.
	 * @returns {Promise<Object[]>} A promise that resolves to an array containing the changelog entry if a difference is found, otherwise an empty array.
	 */
	async function compareValues(value1, value2, path) {
		if (typeof value1 === 'function' || typeof value2 === 'function') {
			throw new Error(`Function found at ${path}`);
		}

		if (value2 == null) {
			return [
				getChangelog(value1, undefined, path, DiffType.Deleted, keysToFilter),
			];
		}

		if (
			Helper.areBothDates(value1, value2) &&
			value1.getTime() !== value2.getTime()
		) {
			return [getChangelog(value1, value2, path, DiffType.Updated, keysToFilter)];
		} else if (Helper.areBothArrays(value1, value2)) {
			return await deepArrayCompare(value1, value2, path);
		} else if (Helper.areBothObjects(value1, value2)) {
			return await deepObjectCompare(value1, value2, path);
		} else if (value1 !== value2) {
			return [getChangelog(value1, value2, path, DiffType.Updated, keysToFilter)];
		}
		return [];
	}

	/**
	 * Recursively compares two elements and returns a detailed changelog.
	 *
	 * @async
	 * @function deepObjectCompare
	 * @param {Object} prior - The original object to compare from.
	 * @param {Object} latest - The new object to compare to.
	 * @param {string} path - The base path for the current comparison, used for changelog entries.
	 * @returns {Promise<Object[]>} A promise that resolves to an array of changelog entries detailing the differences.
	 * @throws {Error} If a function is encountered in either the `prior` or `latest` objects, since functions cannot be compared.
	 */
	async function deepObjectCompare(prior, latest, path) {
		if (hashCompare(prior, latest)) return [];

		const comparePromises = Object.entries(prior).map(async ([key, val]) => {
			if (keysToIgnore && keysToIgnore.includes(key)) return [];

			const currentPath = `${path}.${key}`;
			const latestVal = latest[key];

			return await compareValues(val, latestVal, currentPath);
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
	 * @async
	 * @function deepArrayCompare
	 * @param {Array} prior - The original array to compare from.
	 * @param {Array} latest - The new array to compare to.
	 * @param {string} path - The base path for the current comparison, used for changelog entries.
	 * @returns {Promise<Object[]>} A promise that resolves to an array of changelog entries detailing the differences.
	 * @throws {Error} If a function is encountered in any array element, since functions cannot be compared.
	 */
	async function deepArrayCompare(prior, latest, path) {
		if (hashCompare(prior, latest)) return [];

		const comparePromises = prior.map(async (elem, i) => {
			const currentPath = `${path}[${i}]`;
			const latestElem = latest[i];

			return await compareValues(elem, latestElem, currentPath);
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
