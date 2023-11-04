const performanceLogger = require('./utils/performance-logger');
const { hashCompare } = require('./utils/hash-compare');
const { DiffType, DEFAULT_ROOT } = require('./constants');
const { getChangelog } = require('./utils/get-changelog');

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
 * console.log(diffs); //
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

			if (latest[key] == null) {
				diffs.push(
					getChangelog(value, undefined, currentPath, DiffType.Deleted, keysToFilter)
				);
			} else if (Array.isArray(value)) {
				if (Array.isArray(latest[key])) {
					diffs.push(...(await deepArrayCompare(value, latest[key], currentPath)));
				} else {
					diffs.push(
						getChangelog(
							value,
							latest[key],
							currentPath,
							DiffType.Updated,
							keysToFilter
						)
					);
				}
			} else if (value != null && typeof value === 'object') {
				if (latest[key] != null && typeof latest[key] === 'object') {
					diffs.push(...(await deepObjectCompare(value, latest[key], currentPath)));
				} else {
					diffs.push(
						getChangelog(
							value,
							latest[key],
							currentPath,
							DiffType.Updated,
							keysToFilter
						)
					);
				}
			} else if (value !== latest[key]) {
				diffs.push(
					getChangelog(
						value,
						latest[key],
						currentPath,
						DiffType.Updated,
						keysToFilter
					)
				);
			}

			return diffs;
		});

		const nestedDiffs = await Promise.all(comparePromises);
		const flattenedDiffs = nestedDiffs.flat();

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

		const comparePromises = prior.map(async (currElem, i) => {
			const currentPath = `${path}[${i}]`;
			const diffs = [];

			if (latest.length <= i) {
				diffs.push(
					getChangelog(
						currElem,
						undefined,
						currentPath,
						DiffType.Deleted,
						keysToFilter
					)
				);
			} else if (Array.isArray(currElem)) {
				if (Array.isArray(latest[i])) {
					diffs.push(...(await deepArrayCompare(currElem, latest[i], currentPath)));
				} else {
					diffs.push(
						getChangelog(
							currElem,
							latest[i],
							currentPath,
							DiffType.Updated,
							keysToFilter
						)
					);
				}
			} else if (typeof currElem === 'object') {
				if (typeof latest[i] === 'object') {
					diffs.push(...(await deepObjectCompare(currElem, latest[i], currentPath)));
				} else {
					diffs.push(
						getChangelog(
							currElem,
							latest[i],
							currentPath,
							DiffType.Updated,
							keysToFilter
						)
					);
				}
			} else if (currElem !== latest[i]) {
				diffs.push(
					getChangelog(
						currElem,
						latest[i],
						currentPath,
						DiffType.Updated,
						keysToFilter
					)
				);
			}

			return diffs;
		});

		const nestedDiffs = await Promise.all(comparePromises);
		const flattenedDiffs = nestedDiffs.flat();

		return latest.slice(prior.length).reduce((diffs, currElem, i) => {
			diffs.push(
				getChangelog(
					currElem,
					undefined,
					`${path}[${i + prior.length}]`,
					DiffType.Added,
					keysToFilter
				)
			);
			return diffs;
		}, flattenedDiffs);
	}

	/**
	 * Deeply compares two versions of an object or array and returns a detailed changelog.
	 *
	 * @param {Object|Array} priorVersion - The original or older version.
	 * @param {Object|Array} latestVersion - The updated version.
	 * @param {string} [path='root'] - The starting path to report changelogs.
	 * @returns {Object[]} An array of diffs between the two versions.
	 *
	 * @throws {Error} If either `priorVersion` or `latestVersion` is null or undefined.
	 */
	return async function deepCompare(
		priorVersion,
		latestVersion,
		root = DEFAULT_ROOT
	) {
		const startTime = process.hrtime();
		const diffs = [];

		if (!priorVersion || !latestVersion)
			throw new Error(
				'Two non-null versions must be provided for the deep compare.'
			);

		// Compute hashes for both versions, if they equal so no further compare
		if (hashCompare(priorVersion, latestVersion)) return [];

		if (Array.isArray(priorVersion) && Array.isArray(latestVersion)) {
			diffs.push(...(await deepArrayCompare(priorVersion, latestVersion, root)));
		} else if (
			typeof priorVersion === 'object' &&
			typeof latestVersion === 'object'
		) {
			diffs.push(...(await deepObjectCompare(priorVersion, latestVersion, root)));
		} else {
			diffs.push(
				getChangelog(
					priorVersion,
					latestVersion,
					root,
					DiffType.Updated,
					keysToFilter
				)
			);
		}

		performanceLogger.log('Execution Time: ', process.hrtime(startTime));

		return diffs;
	};
}

module.exports = { createDeepComparer, DiffType };
