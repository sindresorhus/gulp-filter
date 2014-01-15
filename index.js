'use strict';
var gutil = require('gulp-util');
var through = require('through');
var multimatch = require('multimatch');

module.exports = function (pattern) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new gutil.PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	return through(function (file) {
		if (file.isStream()) {
			return this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
		}

		var match = typeof pattern === 'function' ? pattern(file) : multimatch(file.path, pattern).length > 0;

		if (match) {
			return this.queue(file);
		}

		file.gulpFilter = file.gulpFilter || [];
		file.gulpFilter.push(file);
	});
};

module.exports.end = function () {
	return through(function (file) {
		if (file.isStream()) {
			return this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
		}

		// put back previously filtered out files
		if (file.gulpFilter) {
			file.gulpFilter.forEach(function (file) {this.queue(file)}, this);
			file.gulpFilter.length = 0;
		}

		this.queue(file);
	});
};
