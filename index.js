'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var multimatch = require('multimatch');

module.exports = function (pattern) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new gutil.PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	return through.obj(function (file, enc, cb) {
		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
			return cb();
		}

		var match = typeof pattern === 'function' ? pattern(file) :
		            multimatch(file.path, pattern, {dot: true}).length > 0;

		if (match) {
			this.push(file);
			return cb();
		}

		file.gulpFilter = file.gulpFilter || [];
		file.gulpFilter.push(file);
		cb();
	});
};

module.exports.end = function () {
	return through.obj(function (file, enc, cb) {
		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
			return cb();
		}

		// put back previously filtered out files
		if (file.gulpFilter) {
			file.gulpFilter.forEach(function (file) {this.push(file)}, this);
			file.gulpFilter.length = 0;
		}

		this.push(file);
		cb()
	});
};
