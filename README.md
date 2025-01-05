# @shgysk8zer0/squish

Tiny JS compression/decompression library using [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API)

[![CodeQL](https://github.com/shgysk8zer0/squish/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/shgysk8zer0/squish/actions/workflows/codeql-analysis.yml)
![Node CI](https://github.com/shgysk8zer0/squish/workflows/Node%20CI/badge.svg)
![Lint Code Base](https://github.com/shgysk8zer0/squish/workflows/Lint%20Code%20Base/badge.svg)

[![GitHub license](https://img.shields.io/github/license/shgysk8zer0/squish.svg)](https://github.com/shgysk8zer0/squish/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/shgysk8zer0/squish.svg)](https://github.com/shgysk8zer0/squish/commits/master)
[![GitHub release](https://img.shields.io/github/release/shgysk8zer0/squish?logo=github)](https://github.com/shgysk8zer0/squish/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/shgysk8zer0?logo=github)](https://github.com/sponsors/shgysk8zer0)

[![npm](https://img.shields.io/npm/v/@shgysk8zer0/squish)](https://www.npmjs.com/package/@shgysk8zer0/squish)
![node-current](https://img.shields.io/node/v/@shgysk8zer0/squish)
![npm bundle size gzipped](https://img.shields.io/bundlephobia/minzip/@shgysk8zer0/squish)
[![npm](https://img.shields.io/npm/dw/@shgysk8zer0/squish?logo=npm)](https://www.npmjs.com/package/@shgysk8zer0/squish)

[![GitHub followers](https://img.shields.io/github/followers/shgysk8zer0.svg?style=social)](https://github.com/shgysk8zer0)
![GitHub forks](https://img.shields.io/github/forks/shgysk8zer0/squish.svg?style=social)
![GitHub stars](https://img.shields.io/github/stars/shgysk8zer0/squish.svg?style=social)
[![Twitter Follow](https://img.shields.io/twitter/follow/shgysk8zer0.svg?style=social)](https://twitter.com/shgysk8zer0)

[![Donate using Liberapay](https://img.shields.io/liberapay/receives/shgysk8zer0.svg?logo=liberapay)](https://liberapay.com/shgysk8zer0/donate "Donate using Liberapay")
- - -

- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- [Contributing](./.github/CONTRIBUTING.md)
<!-- - [Security Policy](./.github/SECURITY.md) -->

## Efficient Data Compression and Decompression

Squish is a tiny JavaScript library that provides functionalities for efficient data compression and decompression. It supports various input and output formats, making it a versatile tool for optimizing data transmission and storage.

## Features

* **Highly Compressed:** The library itself is minified and compressed to an exceptionally small size, minimizing its footprint in your project.
* **Versatile Input:** Accepts a wide range of input data types, including `ReadableStream`, `ArrayBuffer`, `Uint8Array`, `Blob`, `Response`, `Request`, and even strings.
* **Compression Algorithms:** Supports both `gzip` and `deflate` compression algorithms, providing flexibility for different use cases.
* **Decompression:** Decompresses data compressed with `gzip` and `deflate` algorithms.
* **Rich Output Formats:** Offers a variety of output formats, including `blob`, `stream`, `response`, `buffer`, `bytes`, `hex`, `base64`, `base64url`, `url`, and `text`.

## Installation

You can install the library using npm or by importing from a CDN such as `unpkg.com`:

```bash
npm install `@shgysk8zer0/squish`
```
or with a `<script type="importmap">`

```html
<script type="importmap">
  {
    "imports": {
      "@shgysk8zer0/squish": "https://unpkg.com/@shgysk8zer0/squish@1.0.0/squish.min.js"
    }
  }
</script>
```


## Usage:

The library provides several functions for compression and decompression:

- `compress(data, options)`: Compresses the given data using the specified options.
- `decompress(data, options)`: Decompresses the given data using the specified options.
- `gzip(data, options)`: Compresses the data using the gzip algorithm.
- `gunzip(data, options)`: Decompresses the data compressed with gzip.
- `deflate(data, options)`: Compresses the data using the deflate algorithm.
- `inflate(data, options)`: Decompresses the data compressed with deflate.

## Usage Example

### Basic usage

```js
import { gzip, gunzip } from '@shgysk8zer0/squish';

const compressed = await gzip('Hello, World!');
const decompressed = await gunzip(compressed, { output: 'text' });
```

### Node usage (CJS - ESM also supported)

```js
const { inflate } = require('@shgysk8zer0/squish');
const { readFile } = require('node:js');

async function sendFile(file) {
  const buffer = readFile(file);
  const compressed = await inflate(buffer);
  
  return new Response(compressed);
}
```

## Requirements

This library requires many new features that are not yet wideley supported. A polyfill is provided in node,
but you may want to proved your own for certain usages in browsers.

- [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)
- [`DecompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream)
- [`Unit8Array.prototype.toBase64`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64)
- [`Uint8Array.prototype.toHex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toHex)
- [`Response.prototype.bytes`](https://developer.mozilla.org/en-US/docs/Web/API/Response/bytes)
