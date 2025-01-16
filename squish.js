export const GZIP = 'gzip';
export const DEFLATE = 'deflate';
export const DEFLATE_RAW = 'deflate-raw';
export const DEFAULT_FORMAT = GZIP;

/**
 * Converts a `ReadableStream`, `ArrayBuffer`, `Uint8Array`, or `Blob` into a `ReadableStream`.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} input - The input to convert.
 * @returns {ReadableStream<Uint8Array>} A `ReadableStream` representation of the input.
 * @throws {TypeError} If the input is not a `ReadableStream`, `ArrayBuffer`, `Uint8Array`, or `Blob`.
 */
export function toStream(input) {
	if (typeof input === 'string') {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(input);
				controller.close();
			}
		}).pipeThrough(new TextEncoderStream());
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
	} else {
		throw new TypeError('Unsupported input type.');
	}
}

/**
 *
 * @param {ReadableStream<Uint8Array>} stream
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [output="blob"] - The desired output type.
 * @param {object} [options] - Optional output options.
 * @param {string} [options.type="application/octet-stream"] - `Content-Type` or `Blob.type`
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Data in the specified output format.
 */
export async function fromStream(stream, output = 'blob', { type = 'application/octet-stream' } = {}) {
	if (! (stream instanceof ReadableStream)) {
		throw new TypeError('Stream must be a `ReadableStream` instance.');
	} else {
		switch (output) {
			case 'stream': return stream;
			case 'response': return new Response(stream);
			case 'blob': return new Response(stream, { headers: { 'Content-Type': type }}).blob();
			case 'buffer': return new Response(stream).arrayBuffer();
			case 'bytes': return new Response(stream).bytes();
			case 'hex': return new Response(stream).bytes().then(bytes => bytes.toHex());
			case 'base64': return new Response(stream).then(bytes => bytes.toBase64({ alphabet: 'base64' }));
			case 'base64url': return new Response(stream).then(bytes => bytes.toBase64({ alphabet: 'base64url' }));
			case 'url': return new Response(stream, { headers: { 'Content-Type': type }}).blob().then(blob => URL.createObjectURL(blob));
			case 'text': return new Response(stream, { headers: { 'Content-Type': type }}).text();
			default: throw new TypeError(`Unsupported output: "${output}."`);
		}
	}
}

/**
 * Shared stream utility function
 *
 * @param {"compress"|"decompress"} method
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data
 * @param {object} [options]
 * @param {"gzip"|"deflate"|"deflate-raw"} [options.format="gzip"]
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - The desired output type.
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Data in the specified format.
 */
async function _transform(method, data, {
	format = DEFAULT_FORMAT,
	output = 'blob',
	type = 'application/octet-stream',
	signal,
} = {}) {
	const stream = toStream(data).pipeThrough(
		method === 'compress' ? new CompressionStream(format) : new DecompressionStream(format),
		{ signal }
	);

	return fromStream(stream, output, { type });
}

/**
 * Compresses the given data using the given algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {"gzip"|"deflate"|"deflate-raw"} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function compress(data, { output = 'blob', format = DEFAULT_FORMAT, signal } = {}) {
	return _transform('compress', data, { output, format, signal });
}

/**
 * Compresses the given stream using the given algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"gzip"|"deflate"|"deflate-raw"} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {ReadableStream<Uint8Array>} - Compressed stream in the specified format.
 */
export function compressStream(stream, { format = 'gzip', signal } = {}) {
	if (signal instanceof AbortSignal && signal.aborted) {
		throw signal.reason;
	} else {
		return stream.pipeThrough(new CompressionStream(format, { signal }));
	}
}

/**
 * Decompresses the given data using the given algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {"gzip"|"deflate"|"deflate-raw"} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function decompress(data, { output, format = DEFAULT_FORMAT, signal } = {}) {
	return _transform('decompress', data, { output, format, signal});
}

/**
 * Decompress the given stream using the given algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be decompressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"gzip"|"deflate"|"deflate-raw"} [options.format] An allowed compression format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {ReadableStream<Uint8Array>} - Decompressed stream in the specified format.
 */
export function decompressStream(stream, { format = 'gzip', signal } = {}) {
	if (signal instanceof AbortSignal && signal.aborted) {
		throw signal.reason;
	} else {
		return stream.pipeThrough(new DecompressionStream(format, { signal }));
	}
}

/**
 * Compresses the given data using the gzip algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function gzip(data, { output = 'blob', signal } = {}) {
	return _transform('compress', data, { output, format: GZIP, signal });
}

/**
 * Compresses the given stream using the gzip algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be compressed.
 * @param {object} [options] - Optional compression options.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {ReadableStream<Uint8Array>} - Compressed stream in the gzip format.
 */
export const gzipStream = (stream, { signal } = {}) => compressStream(stream, { format: GZIP, signal });

/**
 * Decompresses the given data using the gzip algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function gunzip(data, { output, signal } = {}) {
	return _transform('decompress', data, { output, format: GZIP, signal });
}

/**
 * Decompress the given stream using the gzip algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be decompressed.
 * @param {object} [options] - Optional decompression options.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {ReadableStream<Uint8Array>} - Decompressed stream in the gzip format.
 */
export const gunzipStream = (stream, { signal } = {}) => decompressStream(stream, { format: GZIP, signal });

/**
 * Compresses the given data using the DEFLATE algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the specified format.
 */
export async function deflate(data, { output = 'blob', signal } = {}) {
	return _transform('compress', data, { output, format: DEFLATE, signal });
}

/**
 * Compresses the given data using the DEFLATE Raw algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be compressed.
 * @param {Object} [options] - Optional compression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Compressed data in the DEFLATE Raw format.
 */
export async function deflateRaw(data, { output = 'blob', signal } = {}) {
	return _transform('compress', data, { output, format: DEFLATE_RAW, signal });
}

/**
 * Compresses the given stream using the DEFLATE algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be compressed.
 * @param {object} [options] - Optional compression options.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {ReadableStream<Uint8Array>} - Compressed stream in the DEFALTE format.
 */
export const deflateStream = (stream, { signal } = {}) => compressStream(stream, { format: DEFLATE, signal });

/**
 * Compresses the given stream using the DEFLATE RAW algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be compressed.
 * @param {object} [options] - Optional compression options.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {ReadableStream<Uint8Array>} - Compressed stream in the DEFALTE RAW format.
 */
export const deflateRawStream = (stream, { signal } = {}) => compressStream(stream, { format: DEFLATE_RAW, signal });

/**
 * Decompresses the given data using the DEFLATE algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function inflate(data, { output, signal } = {}) {
	return _transform('decompress', data, { output, format: DEFLATE, signal });
}

/**
 * Decompresses the given data using the DEFLATE RAW algorithm.
 *
 * @param {ReadableStream<Uint8Array>|ArrayBuffer|Uint8Array|Blob|Request|Response|string} data - The data to be decompressed.
 * @param {Object} [options] - Optional decompression options.
 * @param {"blob"|"stream"|"response"|"buffer"|"bytes"|"hex"|"base64"|"base64url"|"url"|"text"} [options.output="blob"] - Output format.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {Promise<ReadableStream<Uint8Array>|Blob|ArrayBuffer|Uint8Array|Response|string>} - Decompressed data in the specified format.
 */
export function inflateRaw(data, { output, signal } = {}) {
	return _transform('decompress', data, { output, format: DEFLATE_RAW, signal});
}

/**
 * Decompress the given stream using the deflate algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be decompressed.
 * @param {object} [options] - Optional decompression options.
 * @param {AbortSignal} [options.signal] - Signal to abort decompression.
 * @returns {ReadableStream<Uint8Array>} - Decompressed stream in the deflate format.
 */
export const inflateStream = (stream, { signal } = {}) => decompressStream(stream, { format: DEFLATE, signal });

/**
 * Compresses the given stream using the DEFLATE RAW algorithm.
 *
 * @param {ReadableStream<Uint8Array>} stream - The stream to be compressed.
 * @param {object} [options] - Optional compression options.
 * @param {AbortSignal} [options.signal] - Signal to abort compression.
 * @returns {ReadableStream<Uint8Array>} - Compressed stream in the DEFALTE RAW format.
 */
export const inflateRawStream = (stream, { signal } = {}) => decompressStream(stream, { format: DEFLATE_RAW, signal });

/**
 * Streams the contents of a file at the given path. Node only.
 *
 * @param {string|URL} path - The path to the file as either a string or `file:` URL.
 * @param {object} [options] - Optional options for the stream.
 * @param {AbortSignal} [options.signal] - Signal to abort reading file to stream.
 * @returns {ReadableStream<Uint8Array>} - A ReadableStream containing the file's contents.
 * @throws {Error} - If the function is called outside of a Node.js environment.
 * @throws {TypeError} - If the provided path is not a string or a `file:` URL.
 */
export function streamFile(path, { signal } = {}) {
	if (typeof globalThis?.process?.cwd !== 'function') {
		throw new Error('This function is only available in node.');
	} else if (typeof path === 'string') {
		return streamFile(new URL(path, `file://${process.cwd()}`), { signal });
	} else if (! (path instanceof URL)) {
		throw new TypeError('Path must be a `file:` URL.');
	} else if (path.protocol !== 'file:') {
		throw new TypeError(`Cannot read non-file URL: "${path}".`);
	} else if (signal instanceof AbortSignal && signal.aborted) {
		throw signal.reason;
	} else {
		return new ReadableStream({
			async start(controller) {
				try {
					const { createReadStream } = await import('node:fs');
					const fakeStream = createReadStream(path.pathname, { signal });

					try {
						for await (const chunk of fakeStream) {
							controller.enqueue(chunk);
						}
					} catch(err) {
						controller.error(err);
					} finally {
						fakeStream.close();
					}
				} catch(err) {
					controller.error(err);
				} finally {
					controller.close();
				}
			}
		});
	}
}
