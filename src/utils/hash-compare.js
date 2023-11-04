const crypto = require('crypto');

/**
 * Computes a hash for an object or array.
 *
 * @param {Object|Array} data - The data to hash.
 * @returns {string} The hash of the data.
 */
function computeHash(data) {
	return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Compares two versions of an object or array by computing their hashes.
 *
 * This function takes two parameters, computes their SHA-256 hashes, and
 * compares the hashes to determine if the two versions are identical.
 * It is a quick way to check for equality without a deep comparison.
 *
 * @param {Object|Array} priorVersion - The original or older version to compare.
 * @param {Object|Array} latestVersion - The updated or newer version to compare.
 * @returns {boolean} - Returns `true` if the hashes of both versions are equal, indicating no changes; otherwise, returns `false`.
 */
function hashCompare(priorVersion, latestVersion) {
	return computeHash(priorVersion) === computeHash(latestVersion);
}

module.exports = {
	computeHash,
	hashCompare,
};
