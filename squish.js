export const GZIP = 'gzip';
export const DEFLATE = 'deflate';
export const DEFLATE_RAW = 'deflate-raw';
export const DEFAULT_FORMAT = GZIP;

/**
 * Converts a `ReadableStream`, `ArrayBuffer`, `Uint8Array`, or `Blob` into a `ReadableStream`.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} input - The input to convert.
 * @returns {ReadableStream} A `ReadableStream` representation of the input.
 * @throws {TypeError} If the input is not a `ReadableStream`, `ArrayBuffer`, `Uint8Array`, or `Blob`.
 */
function _convert(input) {
	if (typeof input === 'string') {
		return _convert(new TextEncoder().encode(input));
	} else if (typeof input !== 'object') {
		throw new TypeError(`Invalid input type: ${typeof input}.`);
	} else if (input instanceof ReadableStream) {
		return input;
	} else if (input instanceof ArrayBuffer) {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(input));
				controller.close();
			}
		});
	} else if (input instanceof Uint8Array) {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(input);
				controller.close();
			}
		});
	} else if (input instanceof Blob) {
		return input.stream();
	} else if ((input instanceof Response || input instanceof Request) && input.body instanceof ReadableStream) {
		return input.body;
	} else if (input?.buffer instanceof ArrayBuffer) {
		// No infinite loops since check for `ArrayBuffer` was already done
		return _convert(input.buffer);
	} else {
		throw new TypeError('Unsupported input type.');
	}
}

/**
 * Shared stream utility function
 *
 * @param {string} method
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data
 * @param {object} [options]
 * @param {string} [options.output="blob"]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Data in the specified format.
 */
async function _transform(method, data, {
	format = DEFAULT_FORMAT,
	output = 'blob',
	signal,
} = {}) {
	const stream = _convert(data).pipeThrough(
		method === 'compress' ? new CompressionStream(format) : new DecompressionStream(format),
		{ signal }
	);

	if (output === 'stream') {
		return stream;
	} else {
		const resp = new Response(stream);

		switch (output) {
			case 'response': return resp;
			case 'blob': return await resp.blob();
			case 'buffer': return await resp.arrayBuffer();
			case 'bytes': return await resp.bytes();
			case 'hex': return await resp.bytes().then(bytes => bytes.toHex());
			case 'base64': return await resp.bytes().then(bytes => bytes.toBase64({ alphabet: 'base64' }));
			case 'base64url': return await resp.bytes().then(bytes => bytes.toBase64({ alphabet: 'base64url' }));
			case 'url': return await resp.blob().then(blob => URL.createObjectURL(blob));
			case 'text': return await resp.text();
			default: throw new TypeError(`Unsupported output: "${output}."`);
		}
	}
}

/**
 * Compresses the given data using the given algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {'gzip'|'deflate'} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function compress(data, { output = 'blob', format = DEFAULT_FORMAT, signal } = {}) {
	return _transform('compress', data, { output, format, signal });
}

/**
 * Decompresses the given data using the given algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {'gzip'|'deflate'} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function decompress(data, { output, format = DEFAULT_FORMAT, signal } = {}) {
	return _transform('decompress', data, { output, format, signal});
}

/**
 * Compresses the given data using the gzip algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function gzip(data, { output = 'blob', signal } = {}) {
	return _transform('compress', data, { output, format: GZIP, signal });
}

/**
 * Decompresses the given data using the gzip algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function gunzip(data, { output, signal } = {}) {
	return _transform('decompress', data, { output, format: GZIP, signal});
}

/**
 * Compresses the given data using the DEFLATE algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function deflate(data, { output = 'blob', signal } = {}) {
	return _transform('compress', data, { output, format: DEFLATE, signal });
}

/**
 * Decompresses the given data using the DEFLATE algorithm.
 *
 * @param {ReadableStream|ArrayBuffer|Buffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {'blob'|'stream'|'response'|'buffer'|'bytes'|'hex'|'base64'|'base64url'|'url'|'text'} [options.output='blob'] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function inflate(data, { output, signal } = {}) {
	return _transform('decompress', data, { output, format: DEFLATE, signal});
}
