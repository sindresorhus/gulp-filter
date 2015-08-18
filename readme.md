# gulp-filter [![Build Status](https://travis-ci.org/sindresorhus/gulp-filter.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-filter)

> Filter files in a [vinyl](https://github.com/wearefractal/vinyl) stream

Enables you to work on a subset of the original files by filtering them using globbing. When you're done and want all the original files back you just use the `restore` stream.


## Install

```
$ npm install --save-dev gulp-filter
```


## Usage

### Filter only

You may want to just filter the stream content:

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var gulpFilter = require('gulp-filter');

gulp.task('default', function () {
	// create filter instance inside task function
	var filter = gulpFilter(['*', '!src/vendor']);

	return gulp.src('src/*.js')
		// filter a subset of the files
		.pipe(filter)
		// run them through a plugin
		.pipe(jscs())
		.pipe(gulp.dest('dist'));
});
```

### Restoring filtered files

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var gulpFilter = require('gulp-filter');

gulp.task('default', function () {
	// create filter instance inside task function
	var filter = gulpFilter(['*', '!src/vendor'], {restore: true});

	return gulp.src('src/*.js')
		// filter a subset of the files
		.pipe(filter)
		// run them through a plugin
		.pipe(jscs())
		// bring back the previously filtered out files (optional)
		.pipe(filter.restore)
		.pipe(gulp.dest('dist'));
});
```

### Multiple filters

By combining and restoring different filters you can process different sets of files with a single pipeline.

```js
var gulp = require('gulp');
var less = require('gulp-less');
var concat = require('gulp-concat');
var gulpFilter = require('gulp-filter');

gulp.task('default', function () {
	var jsFilter = gulpFilter('**/*.js', {restore: true});
	var lessFilter = gulpFilter('**/*.less', {restore: true});

	return gulp.src('assets/**')
		.pipe(jsFilter)
		.pipe(concat('bundle.js'))
		.pipe(jsFilter.restore)
		.pipe(lessFilter)
		.pipe(less())
		.pipe(lessFilter.restore)
		.pipe(gulp.dest('out/'));
});
```

### Restore as a file source

You can restore filtered files in a different place and use it as a standalone source of files (ReadableStream). Setting the `passthrough` option to `false` allows you to do so.

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var gulpFilter = require('gulp-filter');

gulp.task('default', function () {
	var filter = gulpFilter(['*', '!src/vendor'], {restore: true, passthrough: false});

	var stream = gulp.src('src/*.js')
		// filter a subset of the files
		.pipe(filter)
		// run them through a plugin
		.pipe(jscs())
		.pipe(gulp.dest('dist'));

	// use filtered files as a gulp file source
	filter.restore.pipe(gulp.dest('vendor-dist'));

	return stream;
});
```


## API

### filter(pattern, [options])

Returns a [transform stream](http://nodejs.org/api/stream.html#stream_class_stream_transform) with a [.restore](#optionsrestore) object.

#### pattern

Type: `string`, `array`, `function`

Accepts a string/array with globbing patterns which are run through [multimatch](https://github.com/sindresorhus/multimatch).

If you supply a function you'll get a [vinyl file object](https://github.com/wearefractal/vinyl#file) as the first argument and you're expected to return true/false whether to include the file:

```js
filter(function (file) {
	return /unicorns/.test(file.path);
});
```

#### options

Type: `object`

Accepts [minimatch options](https://github.com/isaacs/minimatch#options).

*Note:* Set `dot: true` if you need to match files prefixed with a dot (eg. `.gitignore`).

#### options.restore

Type: `boolean`
Default: `false`

Restore filtered files.

#### options.passthrough

Type: `boolean`
Default: `true`

When set to `true` filtered files are restored with a PassThrough stream, otherwise, when set to `false`, filtered files are restored as a Readable stream.

When the stream is Readable it ends by itself, but when PassThrough, you are responsible of ending the stream.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
