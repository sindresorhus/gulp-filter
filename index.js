'use strict';
var gutil = require('gulp-util');
var through = require('through');
var minimatch = require('minimatch');

module.exports = function (pattern) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new gutil.PluginError('gulp-filter', '`pattern` should be a string, array or function');
	}

	return through(function (file) {
		if (file.isStream()) {
			return this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
		}

		var match = false;

		if (typeof pattern === 'function') {
			match = pattern(file);
		} else {
			for (var i = 0; i < pattern.length; i++) {
				if (minimatch(file.path, pattern[i])) {
					match = true;
					break;
				}
			}
		}

		if (match) {
			return this.queue(file);
		}

		file.gulpFilter = file.filtered || [];
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
