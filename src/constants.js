const DiffType = {
	Deleted: Symbol('Deleted'),
	Updated: Symbol('Updated'),
	Added: Symbol('Added'),
};

const DEFAULT_ROOT = 'root';

module.exports = { DiffType, DEFAULT_ROOT };
