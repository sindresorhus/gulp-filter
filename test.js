'use strict';
/* eslint-env mocha */
var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');
var filter = require('./');

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
			path: path.join(__dirname, 'included.js')
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'ignored.js')
		}));

		stream.end();
	});

	describe('with restore set to false', function () {
		it('should filter files', function (cb) {
			var stream = filter('included.js', {restore: false});
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
				path: path.join(__dirname, 'included.js')
			}));

			stream.write(new gutil.File({
				base: __dirname,
				path: path.join(__dirname, 'ignored.js')
			}));

			stream.end();
		});
	});

	it('should forward multimatch options', function (cb) {
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
			path: path.join(__dirname, 'nested', 'resource.js')
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'nested', 'resource.css')
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
		var stream = filter(['*', '!*.json', '!*rc'], {dot: true});
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

	it('should filter with respect to current working directory', function (cb) {
		var stream = filter('test/**/*.js');
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'included.js');
			cb();
		});

		// mimic gulp.src('test/**/*.js')
		stream.write(new gutil.File({
			base: path.join(__dirname, 'test'),
			path: path.join(__dirname, 'test', 'included.js')
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'ignored.js')
		}));

		stream.end();
	});

	it('should filter relative paths that leave current directory tree', function (cb) {
		var stream = filter('**/test/**/*.js');
		var buffer = [];
		var gfile = path.join('..', '..', 'test', 'included.js');

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, gfile);
			cb();
		});

		stream.write(new gutil.File({
			path: gfile
		}));

		stream.end();
	});
});

describe('filter.restore', function () {
	it('should bring back the previously filtered files', function (cb) {
		var stream = filter('*.json', {restore: true});
		var buffer = [];
		var completeStream = stream.pipe(stream.restore);
		var completeBuffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		completeStream.on('data', function (file) {
			completeBuffer.push(file);
		});

		completeStream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'package.json');
			assert.equal(buffer[1].path, 'package2.json');
			assert.equal(completeBuffer.length, 3);
			assert.equal(completeBuffer[0].path, 'package.json');
			assert.equal(completeBuffer[1].path, 'app.js');
			assert.equal(completeBuffer[2].path, 'package2.json');
			cb();
		});

		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.write(new gutil.File({path: 'package2.json'}));
		stream.end();
	});

	it('should work when using multiple filters', function (cb) {
		var streamFilter1 = filter(['*.js'], {restore: true});
		var streamFilter2 = filter(['*.json'], {restore: true});
		var buffer = [];

		var completeStream = streamFilter1
			.pipe(streamFilter2)
			.pipe(streamFilter1.restore)
			.pipe(streamFilter2.restore);

		completeStream.on('data', function (file) {
			buffer.push(file);
		});

		completeStream.on('end', function () {
			assert.equal(buffer.length, 3);
			assert.equal(buffer[0].path, 'package.json');
			assert.equal(buffer[1].path, 'app.js');
			assert.equal(buffer[2].path, 'main.css');
			cb();
		});

		streamFilter1.write(new gutil.File({path: 'package.json'}));
		streamFilter1.write(new gutil.File({path: 'app.js'}));
		streamFilter1.write(new gutil.File({path: 'main.css'}));
		streamFilter1.end();
	});

	it('should end when not using the passthrough option', function (cb) {
		var stream = filter('*.json', {restore: true, passthrough: false});
		var restoreStream = stream.restore;
		var buffer = [];

		restoreStream.on('data', function (file) {
			buffer.push(file);
		});

		restoreStream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'app.js');
			cb();
		});

		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.write(new gutil.File({path: 'package2.json'}));
		stream.end();
	});

	it('should not end before the restore stream didn\'t end', function (cb) {
		var stream = filter('*.json', {restore: true});
		var restoreStream = stream.restore;
		var buffer = [];

		restoreStream.on('data', function (file) {
			buffer.push(file);
			if (buffer.length === 1) {
				setImmediate(function () {
					restoreStream.end();
					setImmediate(function () {
						stream.write(new gutil.File({path: 'app2.js'}));
						stream.end();
					});
				});
			}
		});

		restoreStream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'app.js');
			assert.equal(buffer[1].path, 'app2.js');
			cb();
		});

		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
	});

	it('should pass files as they come', function (cb) {
		var stream = filter('*.json', {restore: true});
		var restoreStream = stream.restore;
		var buffer = [];

		restoreStream.on('data', function (file) {
			buffer.push(file);

			if (buffer.length === 4) {
				assert.equal(buffer[0].path, 'package.json');
				assert.equal(buffer[1].path, 'app.js');
				assert.equal(buffer[2].path, 'package2.json');
				assert.equal(buffer[3].path, 'app2.js');
				cb();
			}
		});

		restoreStream.on('end', function () {
			cb(new Error('Not expected to end!'));
		});

		stream.pipe(restoreStream);
		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.write(new gutil.File({path: 'package2.json'}));
		stream.write(new gutil.File({path: 'app2.js'}));
	});

	it('should work when restore stream is not used', function (cb) {
		var stream = filter('*.json');

		for (var i = 0; i < stream._writableState.highWaterMark + 1; i++) {
			stream.write(new gutil.File({path: 'nonmatch.js'}));
		}

		stream.on('finish', cb);
		stream.end();
	});
});
