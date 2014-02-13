'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var filter = require('./index');

describe('filter()', function () {
	it('should filter files', function (cb) {
		var stream = filter('included.js');
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].relative, 'included.js');
			assert.equal(buffer[1].relative, '.gulp-filter');
			assert(buffer[1].isNull());
			cb();
		});

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/included.js'
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/ignored.js'
		}));

		stream.end();
	});

	it('should filter using a function', function (cb) {
		var stream = filter(function (file) {
			return file.path === 'included.js';
		});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'included.js');
			assert.equal(buffer[1].path, '.gulp-filter');
			assert(buffer[1].isNull());
			cb();
		});

		stream.write(new gutil.File({path: 'included.js'}));
		stream.write(new gutil.File({path: 'ignored.js'}));
		stream.end();
	});

	it('should filter files with negate pattern and leading dot', function (cb) {
		var stream = filter(['!*.json', '!*rc']);
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 3);
			assert.equal(buffer[0].path, 'included.js');
			assert.equal(buffer[1].path, 'app.js');
			assert(buffer[2].isNull());
			cb();
		});

		stream.write(new gutil.File({path: 'included.js'}));
		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: '.jshintrc'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.end();
	});
});

describe('filter.end()', function () {
	it('should bring back the previously filtered files', function (cb) {
		var stream = filter.end();
		var buffer = [];
		var ignoredFile = new gutil.File({path: 'ignored.js'});
		var fakeFile = new gutil.File({path: 'new.js'});
		var gulpFilterFile = new gutil.File({path: '.gulp-filter'});
		gulpFilterFile.gulpFilter = [ignoredFile];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer[0].path, 'new.js');
			assert.equal(buffer[1].path, 'ignored.js');
			cb();
		});

		stream.write(fakeFile);
		stream.write(gulpFilterFile);
		stream.end();
	});
});

