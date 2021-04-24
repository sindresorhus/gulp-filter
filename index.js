'use strict';
const path = require('path');
const PluginError = require('plugin-error');
const multimatch = require('multimatch');
const streamfilter = require('streamfilter');
const toAbsoluteGlob = require('to-absolute-glob');

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
			const base = path.dirname(file.path);
			const patterns = pattern.map(pattern => {
				// Filename only matching glob, prepend full path.
				if (!pattern.includes('/')) {
					if (pattern[0] === '!') {
						return '!' + path.resolve(base, pattern.slice(1));
					}

					return path.resolve(base, pattern);
				}

				pattern = toAbsoluteGlob(pattern, {cwd: file.cwd, root: options.root});

				// Calling `path.resolve` after `toAbsoluteGlob` is required for removing `..` from path.
				// This is useful for `../A/B` cases.
				if (pattern[0] === '!') {
					return '!' + path.resolve(pattern.slice(1));
				}

				return path.resolve(pattern);
			});

			match = multimatch(path.resolve(file.cwd, file.path), patterns, options).length > 0;
		}

		callback(!match);
	}, {
		objectMode: true,
		passthrough: options.passthrough !== false,
		restore: options.restore
	});
};
