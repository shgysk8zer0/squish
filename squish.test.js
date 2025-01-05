import '@shgysk8zer0/polyfills';
import { describe, test } from 'node:test';
import { ok, rejects, strictEqual } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { gzip, gunzip, deflate, inflate } from './squish.js';

describe('Test compression and decompression', async () => {
	const src = new URL(import.meta.url).pathname;
	// const src = './squish.min.js';
	const buffer = await readFile(src);
	const file = new File([buffer], src.split('/').at(-1), { type: 'application/javascript' });
	const text = await file.text();

	test('Test gzip compression with `Blob`', async () => {
		const compressed = await gzip(file);

		ok(compressed instanceof Blob, '`compress()` should return a `Blob` by default.');
		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `ArrayBuffer`', async () => {
		const compressed = await gzip(await file.arrayBuffer());

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Uint8Array`', async () => {
		const compressed = await gzip(await file.bytes());

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `ReadableStream`', async () => {
		const compressed = await gzip(file.stream());

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Response`', async () => {
		const compressed = await gzip(new Response(file));

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Request`', async () => {
		const compressed = await gzip(new Request('https://example.com', { method: 'POST', body: file }));

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with node `Buffer`', async () => {
		const compressed = await gzip(buffer);

		strictEqual(await gunzip(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with text', async () => {
		const data = 'Hello, World!';
		const compressed = await gzip(data);

		strictEqual(await gunzip(compressed, { output: 'text' }), data, 'Decompression should result in the original content.');
	});

	test('Test deflate compression', async () => {
		const compressed = await deflate(file);

		strictEqual(await inflate(compressed, { output: 'text' }), text, 'Decompression should result in the original content.');
	});

	test('Verify correct errors are thrown', async () => {
		rejects(() => gzip(9), 'Non string/objects should reject.');
		rejects(() => gzip([9]), 'Invalid object types should reject.');
	});
});
