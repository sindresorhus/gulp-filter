import process from 'node:process';
import path from 'node:path';
import {PassThrough} from 'node:stream';
import PluginError from 'plugin-error';
import multimatch from 'multimatch';
import toAbsoluteGlob from 'to-absolute-glob';
import slash from 'slash';
import transformStream from 'easy-transform-stream';

const isWindows = process.platform === 'win32';

const resolvePattern = (pattern, base) =>
	pattern[0] === '!' ? '!' + path.resolve(base, pattern.slice(1)) : path.resolve(base, pattern);

function matchFile(file, pattern, options) {
	if (typeof pattern === 'function') {
		return pattern(file);
	}

	const base = path.dirname(file.path);

	const patterns = pattern.map(p => {
		if (!p.includes('/')) {
			return resolvePattern(p, base);
		}

		p = toAbsoluteGlob(p, {cwd: file.cwd, root: options.root});

		// Calling `path.resolve` after `toAbsoluteGlob` is required for removing `..` from path.
		// This is useful for `../A/B` cases.
		return resolvePattern(p, base);
	});

	return multimatch(
		path.resolve(file.cwd, file.path),
		isWindows ? patterns.map(p => slash(p)) : patterns,
		options,
	).length > 0;
}

export default function plugin(pattern, options = {}) {
	pattern = typeof pattern === 'string' ? [pattern] : pattern;

	if (!Array.isArray(pattern) && typeof pattern !== 'function') {
		throw new PluginError('gulp-filter', '`pattern` should be a string, array, or function');
	}

	const restore = options.restore ? new PassThrough({objectMode: true}) : undefined;

	const stream = transformStream(
		{objectMode: true},
		file => {
			if (matchFile(file, pattern, options)) {
				return file;
			}

			restore?.push(file);
		},
	);

	if (restore) {
		stream.restore = restore;

		if (options.passthrough === false) {
			stream.once('finish', () => {
				restore.push(null);
			});
		}
	}

	return stream;
}
