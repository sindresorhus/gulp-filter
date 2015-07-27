'use strict';

var gutil = require('gulp-util');
var multimatch = require('multimatch');
var streamfilter = require('streamfilter');

module.exports = function (pattern, options) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;
	options = options || {};

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new gutil.PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	options.passthrough = (false === options.passthough ? false : true);

	return streamfilter(function gulpFilterFunction(file, enc, cb) {
    var match = typeof pattern === 'function' ?
      pattern(file) :
      multimatch(file.relative, pattern, options).length > 0;

    cb(!match);
  }, {
    objectMode: true,
    passthrough: options.passthrough,
    restore: options.restore
  });
};
