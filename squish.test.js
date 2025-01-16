import '@shgysk8zer0/polyfills';
import { describe, test } from 'node:test';
import { ok, rejects, strictEqual, throws } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { gzip, gunzip, deflate, inflate, gzipStream, gunzipStream, deflateStream, inflateStream, streamFile } from './squish.js';
import { setMaxListeners } from 'node:events';

describe('Test compression and decompression', async () => {
	const src = new URL(import.meta.url).pathname;
	// const src = './squish.min.js';
	const buffer = await readFile(src);
	const file = new File([buffer], src.split('/').at(-1), { type: 'application/javascript' });
	const text = await file.text();
	const signal = AbortSignal.timeout(3_000);
	// Disable complaining about events on `signal`
	setMaxListeners(15, signal);

	test('Test gzip compression with `Blob`', { signal }, async () => {
		const compressed = await gzip(file, { signal });

		ok(compressed instanceof Blob, '`compress()` should return a `Blob` by default.');
		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `ArrayBuffer`', { signal }, async () => {
		const compressed = await gzip(await file.arrayBuffer(), { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Uint8Array`', { signal }, async () => {
		const compressed = await gzip(await file.bytes(), { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal}), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `ReadableStream`', { signal }, async () => {
		const compressed = await gzip(file.stream(), { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Response`', { signal }, async () => {
		const compressed = await gzip(new Response(file), { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with `Request`', { signal }, async () => {
		const compressed = await gzip(new Request('https://example.com', { method: 'POST', body: file }), { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with node `Buffer`', { signal }, async () => {
		const compressed = await gzip(buffer, { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Test gzip compression with text', { signal }, async () => {
		const data = 'Hello, World!';
		const compressed = await gzip(data, { signal });

		strictEqual(await gunzip(compressed, { output: 'text', signal }), data, 'Decompression should result in the original content.');
	});

	test('Test deflate compression',  { signal }, async () => {
		const compressed = await deflate(file, { signal });

		strictEqual(await inflate(compressed, { output: 'text', signal }), text, 'Decompression should result in the original content.');
	});

	test('Verify correct errors are thrown', { signal }, async () => {
		rejects(() => gzip(9), 'Non string/objects should reject.');
		rejects(() => gzip([9]), 'Invalid object types should reject.');
	});

	test('Check streaming gzip compression', { signal }, async () => {
		const inputStream = gzipStream(file.stream(), { signal });
		const outputStream = gunzipStream(inputStream, { signal });
		const result = await new Response(outputStream).text();

		strictEqual(result, text, 'Streams should compress and decompress to the original input.');
	});

	test('Check streaming deflate compression', { signal }, async () => {
		const fileStream = streamFile(import.meta.url, { signal });
		const inputStream = deflateStream(fileStream, { signal });
		const outputStream = inflateStream(inputStream, { signal });
		const result = await new Response(outputStream, {
			headers: { 'Content-Type': 'application/javascript' }
		}).text();

		strictEqual(result, text, 'Streams should compress and decompress to the original input.');
	});

	test('Check that errors are thrown as expected.', { signal }, async () => {
		const signal = AbortSignal.abort('These should all error.');
		const stream = streamFile(import.meta.url);

		throws(() => streamFile(import.meta.url, { signal }), 'Reading file should throw with aborted signal.');
		throws(() => gzipStream(stream, { signal }), 'Stream should throw with aborted signal.');

		await Promise.all([
			rejects(() => gzip(text, { signal }), 'Compression should fail if signal is aborted.'),
			rejects(() => gzip(text).then(compressed => gunzip(compressed, { signal })), 'Decompression should fail if signal is aborted.'),
		]);
	});
});
