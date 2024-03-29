const Helper = {
	isObject: function (value) {
		return value != null && typeof value === 'object';
	},

	areBothArrays: function (val1, val2) {
		return Array.isArray(val1) && Array.isArray(val2);
	},

	areBothObjects: function (val1, val2) {
		return this.isObject(val1) && this.isObject(val2);
	},

	areBothDates: function (val1, val2) {
		return val1 instanceof Date && val2 instanceof Date;
	},
};

module.exports = Helper;
