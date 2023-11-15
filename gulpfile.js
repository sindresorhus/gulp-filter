import gulp from 'gulp';
import filter from './index.js';

export default function main() {
	return gulp.src('fixtures/**/*')
		.pipe(filter('**/*.css'))
		.pipe(gulp.dest('dest'));
}
