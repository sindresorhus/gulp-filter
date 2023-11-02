import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Readable} from 'node:stream';
import test from 'ava';
import {pEvent} from 'p-event';
import Vinyl from 'vinyl';
import filter from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('filter', async t => {
	const stream = filter('included.js');
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'included.js'),
	}));
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'ignored.js'),
	}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.relative, 'included.js');
});

test('filter with restore set to false', async t => {
	const stream = filter('included.js', {restore: false});
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'included.js'),
	}));
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'ignored.js'),
	}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.relative, 'included.js');
});

test('forward multimatch options', async t => {
	const stream = filter('*.js', {matchBase: true});
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'nested', 'resource.js'),
	}));
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'nested', 'resource.css'),
	}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.relative, path.join('nested', 'resource.js'));
});

test('filter using a function', async t => {
	const stream = filter(file => file.path === 'included.js');
	stream.write(new Vinyl({path: 'included.js'}));
	stream.write(new Vinyl({path: 'ignored.js'}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.path, 'included.js');
});

test('filter files with negate pattern and leading dot', async t => {
	const stream = filter(['*', '!*.json', '!*rc'], {dot: true});
	stream.write(new Vinyl({path: 'included.js'}));
	stream.write(new Vinyl({path: 'package.json'}));
	stream.write(new Vinyl({path: '.jshintrc'}));
	stream.write(new Vinyl({path: 'app.js'}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.path, 'included.js');
});

test('filter with respect to current working directory', async t => {
	const stream = filter('test/**/*.js');
	stream.write(new Vinyl({
		base: path.join(__dirname, 'test'),
		path: path.join(__dirname, 'test', 'included.js'),
	}));
	stream.write(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'ignored.js'),
	}));
	stream.end();

	const data = await pEvent(stream, 'data');
	t.is(data.relative, 'included.js');
});

test('filter.restore - bring back the previously filtered files', async t => {
	const stream = filter('*.json', {restore: true});
	const completeStream = stream.pipe(stream.restore);
	stream.write(new Vinyl({path: 'package.json'}));
	stream.write(new Vinyl({path: 'app.js'}));
	stream.write(new Vinyl({path: 'package2.json'}));
	stream.end();

	const data = await pEvent(completeStream, 'data');
	t.is(data.path, 'package.json');
});

test('filter.restore - work when using multiple filters', async t => {
	const streamFilter1 = filter(['*.js'], {restore: true});
	const streamFilter2 = filter(['*.json'], {restore: true});
	const completeStream = streamFilter1
		.pipe(streamFilter2)
		.pipe(streamFilter1.restore)
		.pipe(streamFilter2.restore);
	streamFilter1.write(new Vinyl({path: 'package.json'}));
	streamFilter1.write(new Vinyl({path: 'app.js'}));
	streamFilter1.write(new Vinyl({path: 'main.css'}));
	streamFilter1.end();

	const data = await pEvent(completeStream, 'data');
	t.is(data.path, 'package.json');
});

test('filter.restore - end when not using the passthrough option', async t => {
	const stream = filter('*.json', {restore: true, passthrough: false});
	const restoreStream = stream.restore;
	stream.write(new Vinyl({path: 'package.json'}));
	stream.write(new Vinyl({path: 'app.js'}));
	stream.write(new Vinyl({path: 'package2.json'}));
	stream.end();

	const data = await pEvent(restoreStream, 'data');
	t.is(data.path, 'app.js');
});

test('filter.restore - not end before the restore stream didn\'t end', async t => {
	const stream = filter('*.json', {restore: true});
	const restoreStream = stream.restore;
	stream.write(new Vinyl({path: 'package.json'}));
	stream.write(new Vinyl({path: 'app.js'}));
	stream.end();

	const data = await pEvent(restoreStream, 'data');
	t.is(data.path, 'app.js');
});

test('filter.restore - pass files as they come', async t => {
	const stream = filter('*.json', {restore: true});
	const restoreStream = stream.restore;
	stream.pipe(restoreStream);
	stream.write(new Vinyl({path: 'package.json'}));
	stream.write(new Vinyl({path: 'app.js'}));
	stream.write(new Vinyl({path: 'package2.json'}));
	stream.write(new Vinyl({path: 'app2.js'}));
	stream.end();

	const data = await pEvent(restoreStream, 'data');
	t.is(data.path, 'package.json');
});

test('filter.restore - work when restore stream is not used', async t => {
	t.plan(1);

	const stream = filter('*.json');
	for (let index = 0; index < stream._writableState.highWaterMark + 1; index++) {
		stream.write(new Vinyl({path: 'nonmatch.js'}));
	}

	const finish = pEvent(stream, 'finish');
	stream.end();
	await finish;
	t.pass();
});

test('path matching', async t => {
	const testFilesPaths = [
		'/test.js',
		'/A/test.js',
		'/A/C/test.js',
		'/A/B/test.js',
		'/A/B/C/test.js',
		'/A/B/C/d.js',
	];

	const testFiles = testFilesPaths.map(filePath => new Vinyl({cwd: '/A/B', path: filePath}));

	const testCases = [
		{
			description: 'Filename by suffix',
			pattern: ['*.js'],
			expectedFiles: testFiles,
		},
		{
			description: 'Filename by suffix, excluding d.js',
			pattern: ['*.js', '!d.js'],
			expectedFiles: testFiles.slice(0, -1),
		},
		{
			description: 'Absolute filter by suffix',
			pattern: ['/**/*.js'],
			expectedFiles: testFiles,
		},
		{
			description: 'Absolute filter by suffix with prefix',
			pattern: ['/A/**/*.js'],
			expectedFiles: testFiles.slice(1),
		},
		{
			description: 'Absolute filter by suffix with prefix equal to base',
			pattern: ['/A/B/**/*.js'],
			expectedFiles: testFiles.slice(3),
		},
		{
			description: 'Relative filter',
			pattern: ['**/*.js'],
			expectedFiles: testFiles.slice(3),
		},
		{
			description: 'Relative filter but explicit',
			pattern: ['./**/*.js'],
			expectedFiles: testFiles.slice(3),
		},
		{
			description: 'Relative filter with .. prefix',
			pattern: ['../**/*.js'],
			expectedFiles: testFiles.slice(1),
		},
		{
			description: 'Relative filter with path prefix',
			pattern: ['C/**/*.js'],
			expectedFiles: testFiles.slice(4),
		},
		{
			description: 'Relative filter with path prefix, but then ..',
			pattern: ['C/../**/*.js'],
			expectedFiles: testFiles.slice(3),
		},
		{
			description: 'Absolute filter starting with !',
			pattern: ['/**/*', '!/**/*.js'],
			expectedFiles: [],
		},
		{
			description: 'Absolute filter starting with !, filters out all test.js',
			pattern: ['/**/*', '!/**/test.js'],
			expectedFiles: [testFiles[5]],
		},
		{
			description: 'Absolute filter starting with !, . omitted',
			pattern: ['/**/*', '!**/*.js'],
			expectedFiles: testFiles.slice(0, 3),
		},
		{
			description: 'Relative filter starting with !, with .',
			pattern: ['/**/*', '!./**/*.js'],
			expectedFiles: testFiles.slice(0, 3),
		},
		{
			description: 'Mixed filters: absolute filter take files, when absolute negated filter rejects',
			pattern: ['/A/**/*.js', '!/A/B/**/*.js'],
			expectedFiles: testFiles.slice(1, 3),
		},
		{
			description: 'Mixed filters: relative filter take files, when absolute negated filter rejects',
			pattern: ['**/*.js', '!/A/B/C/**/*.js'],
			expectedFiles: testFiles.slice(3, 4),
		},
		{
			description: 'Mixed filters: absolute filter take files, when relative negated filter rejects',
			pattern: ['/A/**/*.js', '!./C/**/*.js'],
			expectedFiles: testFiles.slice(1, 4),
		},
		{
			description: 'Mixed filters: relative filter take files, when relative negated filter rejects',
			pattern: ['**/*.js', '!./C/**/*.js'],
			expectedFiles: testFiles.slice(3, 4),
		},
	];

	for (const testCase of testCases) {
		const stream = filter(testCase.pattern);
		const promise = Readable.from(stream).toArray();

		for (const testFile of testFiles) {
			stream.write(testFile);
		}

		stream.end();

		const files = await promise; // eslint-disable-line no-await-in-loop
		t.deepEqual(files.map(file => file.path), testCase.expectedFiles.map(file => file.path));
	}
});
