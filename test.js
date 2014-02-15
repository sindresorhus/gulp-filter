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
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'included.js');
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

	it('should forward multimatch options', function(cb) {
		var stream = filter('*.js', {matchBase: true});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'nested/resource.js');
			cb();
		});

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/nested/resource.js'
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/nested/resource.css'
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
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'included.js');
			cb();
		});

		stream.write(new gutil.File({path: 'included.js'}));
		stream.write(new gutil.File({path: 'ignored.js'}));
		stream.end();
	});

	it('should filter files with negate pattern and leading dot', function (cb) {
		var stream = filter(['!*.json', '!*rc'], {dot: true});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'included.js');
			assert.equal(buffer[1].path, 'app.js');
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
		fakeFile.gulpFilter = [ignoredFile];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer[0].path, 'ignored.js');
			assert.equal(buffer[1].path, 'new.js');
			cb();
		});

		stream.write(fakeFile);
		stream.end();
	});
});

