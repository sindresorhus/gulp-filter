'use strict';
const path = require('path');
const PluginError = require('plugin-error');
const multimatch = require('multimatch');
const streamfilter = require('streamfilter');

module.exports = (pattern, options = {}) => {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	let absolutePatterns;
	let relativePatterns;
	if (Array.isArray(pattern)) {
		absolutePatterns = pattern.filter(pattern => pattern.startsWith('/'));
		relativePatterns = pattern.filter(pattern => !pattern.startsWith('/'));
	}

	return streamfilter((file, encoding, callback) => {
		let match;

		if (typeof pattern === 'function') {
			match = pattern(file);
		} else {
			if (relativePatterns.length > 0) {
				const relativePath = path.relative(file.cwd, file.path);
				match = multimatch(relativePath, relativePatterns, options).length > 0;
			}

			if (absolutePatterns.length > 0 && !match) {
				match = multimatch(file.path, absolutePatterns, options).length > 0;
			}
		}

		callback(!match);
	}, {
		objectMode: true,
		passthrough: options.passthrough !== false,
		restore: options.restore
	});
};
