'use strict';
/* eslint-env mocha */
const path = require('path');
const {strict: assert} = require('assert');
const Vinyl = require('vinyl');
const filter = require('.');

describe('filter()', () => {
	it('should filter files', cb => {
		const stream = filter('included.js');
		const buffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		stream.on('end', () => {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'included.js');
			cb();
		});

		stream.write(new Vinyl({
			base: __dirname,
			path: path.join(__dirname, 'included.js')
		}));

		stream.write(new Vinyl({
			base: __dirname,
			path: path.join(__dirname, 'ignored.js')
		}));

		stream.end();
	});

	describe('with restore set to false', () => {
		it('should filter files', cb => {
			const stream = filter('included.js', {restore: false});
			const buffer = [];

			stream.on('data', file => {
				buffer.push(file);
			});

			stream.on('end', () => {
				assert.equal(buffer.length, 1);
				assert.equal(buffer[0].relative, 'included.js');
				cb();
			});

			stream.write(new Vinyl({
				base: __dirname,
				path: path.join(__dirname, 'included.js')
			}));

			stream.write(new Vinyl({
				base: __dirname,
				path: path.join(__dirname, 'ignored.js')
			}));

			stream.end();
		});
	});

	it('should forward multimatch options', cb => {
		const stream = filter('*.js', {matchBase: true});
		const buffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		stream.on('end', () => {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, path.join('nested', 'resource.js'));
			cb();
		});

		stream.write(new Vinyl({
			base: __dirname,
			path: path.join(__dirname, 'nested', 'resource.js')
		}));

		stream.write(new Vinyl({
			base: __dirname,
			path: path.join(__dirname, 'nested', 'resource.css')
		}));

		stream.end();
	});

	it('should filter using a function', cb => {
		const stream = filter(file => file.path === 'included.js');

		const buffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		stream.on('end', () => {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'included.js');
			cb();
		});

		stream.write(new Vinyl({path: 'included.js'}));
		stream.write(new Vinyl({path: 'ignored.js'}));
		stream.end();
	});

	it('should filter files with negate pattern and leading dot', cb => {
		const stream = filter(['*', '!*.json', '!*rc'], {dot: true});
		const buffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		stream.on('end', () => {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'included.js');
			assert.equal(buffer[1].path, 'app.js');
			cb();
		});

		stream.write(new Vinyl({path: 'included.js'}));
		stream.write(new Vinyl({path: 'package.json'}));
		stream.write(new Vinyl({path: '.jshintrc'}));
		stream.write(new Vinyl({path: 'app.js'}));
		stream.end();
	});

	it('should filter with respect to current working directory', cb => {
		const stream = filter('test/**/*.js');
		const buffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		stream.on('end', () => {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'included.js');
			cb();
		});

		// Mimic `gulp.src('test/**/*.js')`
		stream.write(new Vinyl({
			base: path.join(__dirname, 'test'),
			path: path.join(__dirname, 'test', 'included.js')
		}));

		stream.write(new Vinyl({
			base: __dirname,
			path: path.join(__dirname, 'ignored.js')
		}));

		stream.end();
	});
});

describe('filter.restore', () => {
	it('should bring back the previously filtered files', cb => {
		const stream = filter('*.json', {restore: true});
		const buffer = [];
		const completeStream = stream.pipe(stream.restore);
		const completeBuffer = [];

		stream.on('data', file => {
			buffer.push(file);
		});

		completeStream.on('data', file => {
			completeBuffer.push(file);
		});

		completeStream.on('end', () => {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'package.json');
			assert.equal(buffer[1].path, 'package2.json');
			assert.equal(completeBuffer.length, 3);
			assert.equal(completeBuffer[0].path, 'package.json');
			assert.equal(completeBuffer[1].path, 'app.js');
			assert.equal(completeBuffer[2].path, 'package2.json');
			cb();
		});

		stream.write(new Vinyl({path: 'package.json'}));
		stream.write(new Vinyl({path: 'app.js'}));
		stream.write(new Vinyl({path: 'package2.json'}));
		stream.end();
	});

	it('should work when using multiple filters', cb => {
		const streamFilter1 = filter(['*.js'], {restore: true});
		const streamFilter2 = filter(['*.json'], {restore: true});
		const buffer = [];

		const completeStream = streamFilter1
			.pipe(streamFilter2)
			.pipe(streamFilter1.restore)
			.pipe(streamFilter2.restore);

		completeStream.on('data', file => {
			buffer.push(file);
		});

		completeStream.on('end', () => {
			assert.equal(buffer.length, 3);
			assert.equal(buffer[0].path, 'package.json');
			assert.equal(buffer[1].path, 'app.js');
			assert.equal(buffer[2].path, 'main.css');
			cb();
		});

		streamFilter1.write(new Vinyl({path: 'package.json'}));
		streamFilter1.write(new Vinyl({path: 'app.js'}));
		streamFilter1.write(new Vinyl({path: 'main.css'}));
		streamFilter1.end();
	});

	it('should end when not using the passthrough option', cb => {
		const stream = filter('*.json', {restore: true, passthrough: false});
		const restoreStream = stream.restore;
		const buffer = [];

		restoreStream.on('data', file => {
			buffer.push(file);
		});

		restoreStream.on('end', () => {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'app.js');
			cb();
		});

		stream.write(new Vinyl({path: 'package.json'}));
		stream.write(new Vinyl({path: 'app.js'}));
		stream.write(new Vinyl({path: 'package2.json'}));
		stream.end();
	});

	it('should not end before the restore stream didn\'t end', cb => {
		const stream = filter('*.json', {restore: true});
		const restoreStream = stream.restore;
		const buffer = [];

		restoreStream.on('data', file => {
			buffer.push(file);
			if (buffer.length === 1) {
				setImmediate(() => {
					restoreStream.end();
					setImmediate(() => {
						stream.write(new Vinyl({path: 'app2.js'}));
						stream.end();
					});
				});
			}
		});

		restoreStream.on('end', () => {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'app.js');
			assert.equal(buffer[1].path, 'app2.js');
			cb();
		});

		stream.write(new Vinyl({path: 'package.json'}));
		stream.write(new Vinyl({path: 'app.js'}));
	});

	it('should pass files as they come', cb => {
		const stream = filter('*.json', {restore: true});
		const restoreStream = stream.restore;
		const buffer = [];

		restoreStream.on('data', file => {
			buffer.push(file);

			if (buffer.length === 4) {
				assert.equal(buffer[0].path, 'package.json');
				assert.equal(buffer[1].path, 'app.js');
				assert.equal(buffer[2].path, 'package2.json');
				assert.equal(buffer[3].path, 'app2.js');
				cb();
			}
		});

		restoreStream.on('end', () => {
			cb(new Error('Not expected to end!'));
		});

		stream.pipe(restoreStream);
		stream.write(new Vinyl({path: 'package.json'}));
		stream.write(new Vinyl({path: 'app.js'}));
		stream.write(new Vinyl({path: 'package2.json'}));
		stream.write(new Vinyl({path: 'app2.js'}));
	});

	it('should work when restore stream is not used', cb => {
		const stream = filter('*.json');

		for (let i = 0; i < stream._writableState.highWaterMark + 1; i++) {
			stream.write(new Vinyl({path: 'nonmatch.js'}));
		}

		stream.on('finish', cb);
		stream.end();
	});
});

// Base directory: /A/B
// Files:
// A /test.js
// B /A/test.js
// C /A/C/test.js
// D /A/B/test.js
// E /A/B/C/test.js

// matching behaviour:
// 1) starting with / - absolute path matching
// 2) starting with .. - relative path mapping, cwd prepended
// 3) starting with just path, like abcd/<...> or **/**.js - relative path mapping, cwd prepended
// special case: matching starting with !

describe('base matching', () => {
	const testFilesPaths = [
		'/test.js',
		'/A/test.js',
		'/A/C/test.js',
		'/A/B/test.js',
		'/A/B/C/test.js',
		'/A/B/C/d.js',
	];
	const testFiles = testFilesPaths.map(path => new Vinyl({cwd: '/A/B', path}));

	const testCases = [
		{
			description: 'Absolute filter by suffix',
			pattern: ['/**/*.js'],
			expectedFiles: testFiles
		},
		{
			description: 'Absolute filter by suffix with prefix',
			pattern: ['/A/**/*.js'],
			expectedFiles: testFiles.slice(1)
		},
		{
			description: 'Absolute filter by suffix with prefix equal to base',
			pattern: ['/A/B/**/*.js'],
			expectedFiles: testFiles.slice(3)
		},
		{
			description: 'Relative filter',
			pattern: ['**/*.js'],
			expectedFiles: testFiles.slice(3)
		},
		{
			description: 'Relative filter but explicit',
			pattern: ['./**/*.js'],
			expectedFiles: testFiles.slice(3)
		},
		{
			description: 'Relative filter with .. prefix',
			pattern: ['../**/*.js'],
			expectedFiles: testFiles.slice(1)
		},
		{
			description: 'Relative filter with path prefix',
			pattern: ['C/**/*.js'],
			expectedFiles: testFiles.slice(4)
		},
		{
			description: 'Relative filter with path prefix, but then ..',
			pattern: ['C/../**/*.js'],
			expectedFiles: testFiles.slice(3)
		},
		{
			description: 'Absolute filter starting with !',
			pattern: ['!/**/*.js'],
			expectedFiles: []
		},
		{
			description: 'Absolute filter starting with !, filters out all test.js',
			pattern: ['!/**/test.js'],
			expectedFiles: [testFiles[5]]
		},
		{
			description: 'Absolute filter starting with !, / omitted',
			pattern: ['!**/test.js'],
			expectedFiles: [testFiles[5]]
		},
		{
			description: 'Relative filter starting with !, . required',
			pattern: ['!./**/*.js'],
			expectedFiles: testFiles.slice(0, 3)
		},
		{
			description: 'Mixed filters: absolute filter take files, when absolute negated filter rejects',
			pattern: ['/A/**/*.js', '!/A/B/**/*.js'],
			expectedFiles: testFiles.slice(1, 3)
		},
		{
			description: 'Mixed filters: relative filter take files, when absolute negated filter rejects',
			pattern: ['**/*.js', '!/A/B/C/**/*.js'],
			expectedFiles: testFiles.slice(3, 4)
		},
		{
			description: 'Mixed filters: absolute filter take files, when relative negated filter rejects',
			pattern: ['/A/**/*.js', '!./C/**/*.js'],
			expectedFiles: testFiles.slice(1, 4)
		},
		{
			description: 'Mixed filters: relative filter take files, when relative negated filter rejects',
			pattern: ['**/*.js', '!./C/**/*.js'],
			expectedFiles: testFiles.slice(3, 4)
		},
	];
	for (const testCase of testCases) {
		it('Should ' + testCase.description, (cb) => {
			const stream = filter(testCase.pattern);

			testFiles.forEach(file => stream.write(file));

			const files = [];
			stream.on('data', file => {
				files.push(file);
			});
			stream.on('end', () => {
				assert.deepEqual(files.map(f => f.path), testCase.expectedFiles.map(f => f.path));
				cb();
			});
			stream.end();
		});
	}
})
