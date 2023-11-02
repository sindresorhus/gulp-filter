# gulp-filter

> Filter files in a [`vinyl`](https://github.com/gulpjs/vinyl) stream

Enables you to work on a subset of the original files by filtering them using glob patterns. When you're done and want all the original files back, you just use the `restore` stream.

## Install

```sh
npm install --save-dev gulp-filter
```

## Usage

### Filter only

You may want to just filter the stream content:

```js
import gulp from 'gulp';
import uglify from 'gulp-uglify';
import filter from 'gulp-filter';

export default () => {
	// Create filter instance inside task function
	const f = filter(['**', '!*src/vendor']);

	return gulp.src('src/**/*.js')
		// Filter a subset of the files
		.pipe(f)
		// Run them through a plugin
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
};
```

### Restoring filtered files

```js
import gulp 'gulp';
import uglify 'gulp-uglify';
import filter 'gulp-filter';

export default () => {
	// Create filter instance inside task function
	const f = filter(['**', '!*src/vendor'], {restore: true});

	return gulp.src('src/**/*.js')
		// Filter a subset of the files
		.pipe(f)
		// Run them through a plugin
		.pipe(uglify())
		// Bring back the previously filtered out files (optional)
		.pipe(f.restore)
		.pipe(gulp.dest('dist'));
};
```

### Multiple filters

By combining and restoring different filters you can process different sets of files with a single pipeline.

```js
import gulp from 'gulp';
import less from 'gulp-less';
import concat from 'gulp-concat';
import filter from 'gulp-filter';

export default () => {
	const jsFilter = filter('**/*.js', {restore: true});
	const lessFilter = filter('**/*.less', {restore: true});

	return gulp.src('assets/**')
		.pipe(jsFilter)
		.pipe(concat('bundle.js'))
		.pipe(jsFilter.restore)
		.pipe(lessFilter)
		.pipe(less())
		.pipe(lessFilter.restore)
		.pipe(gulp.dest('out/'));
};
```

### Restore as a file source

You can restore filtered files in a different place and use it as a standalone source of files (ReadableStream). Setting the `passthrough` option to `false` allows you to do so.

```js
import gulp 'gulp';
import uglify 'gulp-uglify';
import filter 'gulp-filter';

export default () => {
	const f = filter(['**', '!*src/vendor'], {restore: true, passthrough: false});

	const stream = gulp.src('src/**/*.js')
		// Filter a subset of the files
		.pipe(f)
		// Run them through a plugin
		.pipe(uglify())
		.pipe(gulp.dest('dist'));

	// Use filtered files as a gulp file source
	f.restore.pipe(gulp.dest('vendor-dist'));

	return stream;
};
```

## API

### filter(pattern, options?)

Returns a [transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform) with a [.restore](#optionsrestore) property.

#### pattern

Type: `string | string[] | Function`

Accepts a string/array with globbing patterns which are run through [multimatch](https://github.com/sindresorhus/multimatch).

If you supply a function, you'll get a [`vinyl` file object](https://github.com/wearefractal/vinyl#file) as the first argument and you're expected to return a boolean of whether to include the file:

```js
filter(file => /unicorns/.test(file.path));
```

#### options

Type: `object`

Accepts [`minimatch` options](https://github.com/isaacs/minimatch#options).

*Note:* Set `dot: true` if you need to match files prefixed with a dot, for example, `.gitignore`.

##### restore

Type: `boolean`\
Default: `false`

Restore filtered files.

##### passthrough

Type: `boolean`\
Default: `true`

When set to `true`, filtered files are restored with a `stream.PassThrough`, otherwise, when set to `false`, filtered files are restored as a `stram.Readable`.

When the stream is a `stream.Readable`, it ends by itself, but when it's `stream.PassThrough`, you are responsible of ending the stream.
