# [gulp](http://gulpjs.com)-filter [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-filter.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-filter)

> Filter files in a [vinyl](https://github.com/wearefractal/vinyl) stream

Enables you to work on a subset of the original files by filtering them using globbing. When you're done and want all the original files back you just call the end function.


## Install

Install with [npm](https://npmjs.org/package/gulp-filter)

```
npm install --save-dev gulp-filter
```


## Example

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var gulpFilter = require('gulp-filter');

var filter = gulpFilter('!src/vendor');

gulp.task('default', function () {
    gulp.src('src/*.js')
		// filter a subset of the files
		.pipe(filter)
		// run them through a plugin
		.pipe(jscs())
		// bring back the previously filtered out files (optional)
		.pipe(filter.restore())
		.pipe(gulp.dest('dist'));
});
```

## Multiple filters example
By combining and restoring different filters you can process different sets of files with a single pipeline.

```js
var gulp = require('gulp');
var clone = require('gulp-clone');
var concat = require('gulp-concat');
var gulpFilter = require('gulp-filter');

var frontPageBundleFilter = gulpFilter(['assets/frontpage/*.js', 'assets/common/*.js']);
var adminBundleFilter = gulpFilter(['assets/admin/*.js', 'assets/common/*.js']);

var cloneSink1 = clone();
var cloneSink2 = clone();

gulp.task('default', function () {
    gulp.src('assets/**/*.js')
        // select files from the frist bundle
        .pipe(frontPageBundleFilter)
        // clone objects streaming through this point
        .pipe(cloneSink1)
        .pipe(concat("frontPageBundle.js"))
        // restore cloned files
        .pipe(cloneSink1.tap())
        // restore filtered out files
        .pipe(frontPageBundleFilter.restore())
        // select files from the admin bundle
        .pipe(adminBundleFilter)
        .pipe(cloneSink2)
        .pipe(concat("adminBundle.js"))
        .pipe(cloneSink2.tap())
        .pipe(adminBundleFilter.restore())
        //save frontPageBundle.js, adminBundle.js and individual sources
        .gulp.dest('out/');
});

```


## API

### filter(pattern)

#### pattern

Type: `String`|`Array`|`Function`

Accepts a string/array with globbing patterns which are run through [multimatch](https://github.com/sindresorhus/multimatch).

If you supply a function you'll get a [vinyl file object](https://github.com/wearefractal/vinyl#file) as the first argument and you're expected to return true/false whether to include the file:

```js
filter(function (file) {
	return /unicorns/.test(file.path);
});
```

Returns a stream.Transform


### stream.restore()

Brings back the previously filtered out files.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
