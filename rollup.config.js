import terser from '@rollup/plugin-terser';

export default [{
	input: 'squish.js',
	external: ['node:fs'],
	output: [{
		file: 'squish.min.js',
		format: 'module',
		plugins: [terser()],
		sourcemap: true,
	}],
}, {
	input: 'node.js',
	external: ['@shgysk8zer0/polyfills', 'node:fs'],
	output: [{
		file: 'squish.cjs',
		format: 'cjs',
	}],
}];
