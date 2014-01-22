'use strict';
var through = require('through2');
var match = require('gulp-match');

module.exports = function (condition) {
	return through.obj(function (file, enc, cb) {
		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-filter', 'Streaming not supported'));
			return cb();
		}

		if (match(file,condition)) {
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
