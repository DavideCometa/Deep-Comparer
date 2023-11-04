/**
 * Filters the keys of an object based on the provided list of keys to hide.
 * If the object is an array, the function is applied recursively to each item in the array.
 *
 * @param {Object|Array} obj - The object or array to filter.
 * @returns {Object|Array} The filtered object or array.
 */
function filterObjectKeys(obj, keysToFilter) {
	if (!obj || typeof obj !== 'object' || !keysToFilter) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => filterObjectKeys(item, keysToFilter));
	} else {
		return Object.entries(obj).reduce((formattedObj, [key, value]) => {
			if (!keysToFilter.includes(key)) {
				formattedObj[key] = filterObjectKeys(value, keysToFilter);
			}
			return formattedObj;
		}, {});
	}
}

module.exports = { filterObjectKeys };
