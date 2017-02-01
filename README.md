# Jetta
## A fast and simple HTTP(S) request and URL-parsing library

[![Jetta by Altus Aero][shield-io-altusaero]][altusaero-github] [![npm version][shield-io-npm-version]][npm] [![npm total downloads][shield-io-npm-total-downloads]][npm] [![npm license][shield-io-npm-license]][npm] [![AppVeyor][shield-io-AppVeyor]][appveyor] [![Travis CI][shield-io-Travis-CI]][travis] [![Travis CI][shield-io-Coveralls]][coveralls] [![GitHub - Issues Open][shield-io-GitHub-Issues-Open]][github-issues] [![GitHub - Pull Requests Open][shield-io-GitHub-Pull-Requests-Open]][github-pulls] [![GitHub - Contributors][shield-io-GitHub-Contributors]][github-graphs-contributors] [![Standard - JavaScript Style Guide][shield-io-standard-style]][standardjs]

[shield-io-altusaero]: https://img.shields.io/badge/altusaero-jetta-4679AB.svg?style=flat-square
[shield-io-npm-version]: https://img.shields.io/npm/v/jetta.svg?style=flat-square
[shield-io-npm-total-downloads]: https://img.shields.io/npm/dt/jetta.svg?style=flat-square
[shield-io-npm-license]: https://img.shields.io/npm/l/jetta.svg?style=flat-square
[shield-io-AppVeyor]: https://img.shields.io/appveyor/ci/DanielBankhead/jetta.svg?style=flat-square&label=appveyor
[shield-io-Travis-CI]: https://img.shields.io/travis/AltusAero/jetta.svg?style=flat-square&label=travis
[shield-io-Coveralls]: https://img.shields.io/coveralls/AltusAero/jetta.svg?style=flat-square
[shield-io-GitHub-Issues-Open]: https://img.shields.io/github/issues-raw/altusaero/jetta.svg?style=flat-square
[shield-io-GitHub-Pull-Requests-Open]: https://img.shields.io/github/issues-pr-raw/altusaero/jetta.svg?style=flat-square
[shield-io-GitHub-Contributors]: https://img.shields.io/github/contributors/altusaero/jetta.svg?style=flat-square
[shield-io-standard-style]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square

[altusaero-github]: https://github.com/altusaero/
[npm]: https://npmjs.com/package/jetta/
[appveyor]: https://ci.appveyor.com/project/DanielBankhead/jetta
[travis]: https://travis-ci.org/AltusAero/jetta
[coveralls]: https://coveralls.io/github/AltusAero/jetta
[github-issues]: https://github.com/AltusAero/jetta/issues
[github-pulls]: https://github.com/AltusAero/jetta/pulls
[github-graphs-contributors]: https://github.com/AltusAero/jetta/graphs/contributors
[standardjs]: http://standardjs.com/



```js
const jetta = require('jetta')

// build-in URL parser
jetta.request('altusaero.com', (error, results) => {
  if (error !== null) {
    // Results contains useful error details
    console.dir(results.error)
  } else {
    // Results contain useful pieces of data - including response time, response headers, decompression info, and more
    const responseTime = results.time.response
    const html = results.data.toString()
    // '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">...
  }
})

// build-in URL parser
jetta.urlParser('foo-bar').valid === false
jetta.urlParser('127.0.0.12', {localhostAllowed: true}).isLocalhost === true
jetta.urlParser('example.com', {addMissingProtocol: true}).parsedURL.href === 'https://example.com/'
```


## Installation

```sh
$ npm install jetta --save
```


## Features

- Easy to use - all while preserving functionality
- Requests
  - Fast - is a thin abstraction on top of node's native modules
  - built-in decompressor
  - convenient STDOUT progress-logging functionality
- URL Parser
  - Parse and validate URLs with or without making a request
- Secure by default
  - localhost is invalid by default
  - request defaults to `https` if url's protocol is missing
- Doesn't make assumptions - returns the data so that you may decide what to do with it
- 0 dependencies
  - easy to review the source code for ideas and security purposes


## Quick Start

```js
const jetta = require('jetta')

const url = 'https://altusaero.net/images/site/1920x1080/pexels-photo+(15).jpg'

jetta.request(url, {useDefaultProgressLogger: true}, (error, results) => {
  if (error !== null) {
    throw error
  } else {
    // do stuff with results...
    fs.writeFile(path.basename(results.url.parsedURL.path), results.data, (error) => {
      if (error !== null) throw error
      console.log('done.')
    })
  }
})
```


## Usage

`jetta` OBJECT
  - `defaults` OBJECT
    - the default options for `jetta.request` and `jetta.urlParser`

  - `error` OBJECT
    - the error information for an error, useful for:
      - receiving additional information behind an error
      - sending an error directly to a client in their native language
      - debugging
    - every key corresponds to `results.error.type` ('http-request-error') from a request when an error has occurred
    - every object has the following attributes:
      - `details` BOOLEAN
        - determines if an error includes an `Error` object with extended stack details
        - See `results.error.details` from a request when an error has occurred
      - `message` OBJECT
        - an object with messages in a specified language as an ISO 639-1 code, such as 'en' for English
        - Example:
        ```js
        jetta.error['http-request-aborted-server'].message.en
        // > 'The server aborted the request. The server may be busy or is having trouble with the request parameters.'
        ```

  - `ProgressLogger` CLASS
    - jetta's native STDOUT streaming progress logger
    - can use be used:
      - In `jetta.request` via `options.useDefaultProgressLogger = true`
        - convenient
      - In `jetta.request` via `options.progressLog = new ProgressLogger()`
        - useful if you want to re-use multiple requests
      - Outside of `jetta.request`, for any of your progress logging needs
    - Example:
    ```js
    const progressLogger = new jetta.ProgressLogger()
    ```

    - Complete documentation can be found in [docs/progress-logger.md](docs/progress-logger.md).

  - `request` (url[, options], callback[, currentRedirects])
    - make an HTTP(S) request
    - Example:
    ```js
    jetta.request('altusaero.com', (error, results) => {
      if (error !== null) {
        throw error
      } else {
        const html = results.data.toString()
        // ...
      }
    })
    ```

    - Complete documentation can be found in [docs/request.md](docs/request.md).

  - `urlParser` (candidate[, options])
    - Parse and validate URLs

    - `candidate` STRING | OBJECT
      - The URL to parse and validate
      - If STRING, will be via parsed
      - If OBJECT:
        - if an instance of `url.Url` (as in, node's [url](https://nodejs.org/api/url.html) module), it will not be parsed (to preserve performance), but will be further processed and validated
        - else, will parse the `href` property of object
      - Can be set to `null` if you want to pass options directly
        - Useful if using `socketPath` in `options.requestOptions` for UNIX Domain Sockets or Named Pipes on Windows

    - `options` OBJECT _optional_
      - Defaults can be found in `jetta.defaults.urlParser`

      - `addMissingProtocol` BOOLEAN
        - Determines if missing protocols should be added for parsing
        - Example:
        ```js
        jetta.urlParser('example.com', {addMissingProtocol: true}).url
        // > 'https://example.com'
        ```

      - `protocolReplacement` STRING
        - The protocol to be added when the parsed url's protocol is missing and `addMissingProtocol === true`
        - _NOTE_: It should be without colons and slashes. i.e. 'https' not 'https:' or 'https://'

      - `localhostAllowed` BOOLEAN
        - Determines if localhost URLs are considered valid
        - Example:
        ```js
        jetta.urlParser('http://127.0.0.1', {localhostAllowed: true}).valid
        // > true
        jetta.urlParser('http://localhost', {localhostAllowed: false}).valid
        // > false
        jetta.urlParser('::1', {localhostAllowed: true}).valid
        // > true
        ```

    - _return_ `results` OBJECT
      - `options` OBJECT
        - The options used to parse, process, and validate `candidate`

      - `parsedURL` url.Url
        - The parsed URL, an instance of node's [url](https://nodejs.org/api/url.html) module

      - `url` STRING
        - `candidate` - in standard URL form

      - `valid` BOOLEAN
        - Determines if `candidate` is valid, given the parameters

<!-- TODO:
  See [examples](examples).
-->


## Motivation

We wanted a simple, flexible, and easy-to-use request library that didn't compromise on performance and features.
  - Built-in URL validator - we wanted to validate URLs, not simply you want to request the URLs
  - Return useful statistics, such as `time` and `response headers`
  - Detailed error messages - Describe exactly where and how the request went wrong - not just an error Object
  - Minimal dependencies - less licensing and code to review, for security and legal purposes


## Goals
  - keep it simple
  - keep it fast - it's name is _jetta_, as in _jet stream_
  - keep it secure
  - keep it lightweight (minimal dependencies)


## Notes
  - this project will move from **alpha** to **beta**
    - `tests` are currently under development - after there are finalized
    - Each error in `data/error.json` has a message in `en`.


## Credits
  - Forms support inspired by [simple-get](https://github.com/feross/simple-get/)


## Future
  - Streamable response
  - easy range option support
  - Multi-language error messages
    - See data/error.json

  - See more in [FUTURE.md](FUTURE.md)
