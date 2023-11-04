const chai = require('chai');
const { expect } = chai;
const performanceLogger = require('../performance-logger');

describe('Performance Logger Util', () => {
	const originalConsoleLog = console.log;
	let logArgs;

	beforeEach(() => {
		logArgs = [];
		console.log = (...args) => {
			logArgs.push(args);
		};
	});

	afterEach(() => {
		console.log = originalConsoleLog;
		process.env.NODE_ENV = 'test';
	});

	it('should log message and execution time when isEnabled is true', () => {
		performanceLogger.log('Execution Time:', [1, 2000000]);

		expect(logArgs.length).to.equal(1);
		expect(logArgs[0]).to.deep.equal(['Execution Time:', '1s 2ms']);
	});

	it('should not log message and execution time when isEnabled is false', () => {
		process.env.NODE_ENV = 'production';
		performanceLogger.log('Execution Time:', [1, 2000000]);

		expect(logArgs.length).to.equal(0);
	});
});
