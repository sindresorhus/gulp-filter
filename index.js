'use strict';
var path = require('path');
var gutil = require('gulp-util');
var multimatch = require('multimatch');
var streamfilter = require('streamfilter');

module.exports = function (pattern, options) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;
	options = options || {};

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new gutil.PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	return streamfilter(function (file, enc, cb) {
		var match;
		if (typeof pattern === 'function') {
			match = pattern(file);
		} else {
			var relPath = path.relative(file.cwd, file.path);
			// if the path leaves the current working directory, then we need to
			// resolve the absolute path so that the path can be properly matched
			// by minimatch (via multimatch)
			if (relPath.indexOf('../') === 0) {
				relPath = path.resolve(relPath);
			}
			match = multimatch(relPath, pattern, options).length > 0;
		}

		cb(!match);
	}, {
		objectMode: true,
		passthrough: options.passthough !== false,
		restore: options.restore
	});
};
