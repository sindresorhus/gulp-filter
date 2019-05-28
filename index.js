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

	return streamfilter((file, encoding, callback) => {
		let match;

		if (typeof pattern === 'function') {
			match = pattern(file);
		} else {
			let relativePath = path.relative(file.cwd, file.path);

			// If the path leaves the current working directory, then we need to
			// resolve the absolute path so that the path can be properly matched
			// by minimatch (via multimatch)
			if (/^\.\.[\\/]/.test(relativePath)) {
				relativePath = path.resolve(relativePath);
			}

			match = multimatch(relativePath, pattern, options).length > 0;
		}

		callback(!match);
	}, {
		objectMode: true,
		passthrough: options.passthrough !== false,
		restore: options.restore
	});
};
