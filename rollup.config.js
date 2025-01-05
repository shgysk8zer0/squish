import terser from '@rollup/plugin-terser';

export default [{
	input: 'squish.js',
	output: [{
		file: 'squish.min.js',
		format: 'module',
		plugins: [terser()],
		sourcemap: true,
	}],
}, {
	input: 'node.js',
	external: ['@shgysk8zer0/polyfills'],
	output: [{
		file: 'squish.cjs',
		format: 'cjs',
	}],
}];
