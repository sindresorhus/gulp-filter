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
var filter = require('gulp-filter');

gulp.task('default', function () {
	gulp.src('src/*.js')
		// filter a subset of the files
		.pipe(filter('!src/vendor'))
		// run them through a plugin
		.pipe(jscs())
		// bring back the previously filtered out files (optional)
		.pipe(filter.end())
		.pipe(gulp.dest('dist'));
});
```


## API

### filter(pattern, options)

#### pattern

Type: `String`|`Array`|`Function`

Accepts a string/array with globbing patterns which are run through [multimatch](https://github.com/sindresorhus/multimatch).

If you supply a function you'll get a [vinyl file object](https://github.com/wearefractal/vinyl#file) as the first argument and you're expected to return true/false whether to include the file:

```js
filter(function (file) {
	return /unicorns/.test(file.path);
});
```

#### options

Type: `Object`

Accepts [minimatch options](https://github.com/isaacs/minimatch#options).

*NOTE*: If you need to match files beginning with a dot (.), you need to supply the `dot: true` options.

### filter.end()

Resets the filter and brings back the previously filtered out files.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
