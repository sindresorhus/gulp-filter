'use strict';
const PluginError = require('plugin-error');
const multimatch = require('multimatch');
const path = require('path');
const streamfilter = require('streamfilter');
const toAbsoluteGlob = require('to-absolute-glob');

/**
 * @param {string | string[]|function(string):boolean} pattern
 * @param {object} options
 * @returns {Stream}
 */
module.exports = (pattern, options = {}) => {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	return streamfilter((file, encoding, callback) => {
		let match;

		if (typeof pattern === 'function') {
			match = pattern(file);
		} else {
			const patterns = pattern.map(pattern => toAbsoluteGlob(pattern, {cwd: file.cwd, root: options.root}))
				.map(pattern => pattern[0] === '!' ? '!' + path.resolve(pattern.slice(1)) : path.resolve(pattern));

			match = multimatch(file.path, patterns, options).length > 0;
		}

		callback(!match);
	}, {
		objectMode: true,
		passthrough: options.passthrough !== false,
		restore: options.restore
	});
};
