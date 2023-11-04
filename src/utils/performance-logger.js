const performanceLogger = {
	log(message, executionTime) {
		if (process.env.NODE_ENV === 'test') {
			console.log(message, `${executionTime[0]}s ${executionTime[1] / 1e6}ms`);
		}
	},
};

module.exports = performanceLogger;
