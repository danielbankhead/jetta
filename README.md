# Jetta
## A powerful, multi-protocol request library and toolkit ✈️

[![Jetta by Altus Aero][shield-io-altusaero]][altusaero-github] [![npm version][shield-io-npm-version]][npm] [![npm total downloads][shield-io-npm-total-downloads]][npm] [![npm license][shield-io-npm-license]][npm] [![AppVeyor][shield-io-AppVeyor]][appveyor] [![Travis CI][shield-io-Travis-CI]][travis] [![Travis CI][shield-io-Coveralls]][coveralls] [![GitHub - Issues Open][shield-io-GitHub-Issues-Open]][github-issues] [![GitHub - Pull Requests Open][shield-io-GitHub-Pull-Requests-Open]][github-pulls] [![GitHub - Contributors][shield-io-GitHub-Contributors]][github-graphs-contributors] [![Standard - JavaScript Style Guide][shield-io-standard-style]][standardjs]

[shield-io-altusaero]: https://img.shields.io/badge/altusaero-jetta-4679AB.svg?style=flat-square
[shield-io-npm-version]: https://img.shields.io/npm/v/jetta.svg?style=flat-square
[shield-io-npm-total-downloads]: https://img.shields.io/npm/dt/jetta.svg?style=flat-square
[shield-io-npm-license]: https://img.shields.io/npm/l/jetta.svg?style=flat-square
[shield-io-AppVeyor]: https://img.shields.io/appveyor/ci/DanielBankhead/jetta/master.svg?style=flat-square&label=appveyor
[shield-io-Travis-CI]: https://img.shields.io/travis/AltusAero/jetta/master.svg?style=flat-square&label=travis
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

jetta.request('altusaero.com', (error, results) => {
  if (error !== null) {
    throw error // contains extended details along with multi-language support
  } else {
    console.dir(results, {colors: true}) // response time, headers, normalized options used, and more
    console.log(results.data.toString()) // <!DOCTYPE html><html lang="en"><head><meta charset="utf-8">...
  }
})
```

```js
// Other useful tools:
async function myRequest (url = 'altusaero.com', options = {}) {
  results = await jetta.requestPromise(url, options)
}

const cookieManager = new jetta.CookieManager()
const publicSuffix = new jetta.PublicSuffix()

jetta.urlParser('foo-bar').isValid // false
jetta.urlParser('127.0.0.12').isLocalhost // true
jetta.urlParser('example.com', {addMissingProtocol: true}).parsedURL.href // 'https://example.com/'
```


## Installation

```sh
$ npm install jetta
```


## Features

- Easy to use, feature-rich, with secure defaults
- **Requests** - fast with useful built-in features:
  - Callback and promise support
  - Auto-parse JSON responses
  - Saves bandwidth by supporting requests that have multiple levels of compression (`Content-Encoding`)
  - Built-in checksum generator
  - Custom engine support
  - Convenient request body handlers for forms, JSON, and streams
  - Makes minimal assumptions - returns the data so that you may decide what to do with it
  - Provides [guarantees](docs/request.md#guarantees) so that you may always have consistent data
- **Cookie manager** - add, delete, and update cookies with or without making a request
  - Generate Cookie and Set-Cookie headers with context (domain, subdomains, path, security, HttpOnly, etc.)
  - Built-in public suffix manager - no worries on 'super cookies' being sent any parent domains
  - Easy JSON import and export
  - Automatically deletes expired cookies
- **Public suffix manager** - easy, automated public suffix list manager
  - Automatically updates from sources you specify (useful open source defaults are available)
  - Easily check against the database
- **URL parser** - parse and validate URLs
  - IDN support
- Well-tested with **100% code coverage**
- **0** dependencies
  - Easy to review the source code for ideas and security purposes


## Quick Start

```js
const jetta = require('jetta')

const imageURL = 'https://altusaero.net/images/site/1920x1080/pexels-photo+(15).jpg'
const options = {toFile: 'pexels-photo+(15).jpg'}

jetta.request(imageURL, options, (error, results) => {
  if (error !== null) {
    console.error(`${error.code} [${error.lang}]: ${error.message}`)
  } else {
    console.log(`wrote: ${options.toFile}`)
  }
})
```


## Usage

### jetta.defaults `OBJECT`
  - The global default options
  - Options passed to jetta functions and constructors will overwrite these defaults for that particular call or instance

### jetta.cookieLib `OBJECT`
  - A utility for parsing, stringifying, and validating cookies.
  - Example:
  ```js
  const cookie = jetta.cookieLib.parseSetCookie('id=example; Domain=example.com; Secure; SameSite')
  ```

  - Complete documentation can be found in [docs/cookie-lib.md](docs/cookie-lib.md).

### jetta.CookieManagerCookie `CLASS`
  - A simple object representing a cookie prepared for storage
  - Created internally by `jetta.CookieManager` instances where cookies are returned
  - Handy for using with `instanceof` and *instance*`.constructor` throughout your codebase
  - Example:
  ```js
  const cookieForStorage = new jetta.CookieManagerCookie()
  ```

  - Complete documentation can be found in [docs/cookie-manager.md](docs/cookie-manager.md).

### jetta.CookieManager `CLASS` extends `EventEmitter`
  - Add, delete, and update cookies
  - Generate Cookie and Set-Cookie headers with context (domain, subdomains, path, security, HttpOnly, etc.)
  - Automatically deletes expired cookies
  - Built-in `jetta.PublicSuffix` to make sure you're not saving & sending [supercookies](https://en.wikipedia.org/wiki/HTTP_cookie#Supercookie)
  - Example:
  ```js
  const cm = new jetta.CookieManager()
  ```

  - Complete documentation can be found in [docs/cookie-manager.md](docs/cookie-manager.md).

### jetta.domainLib `OBJECT`
  - A utility for comparing and analyzing domains
  - Example:
  ```js
  jetta.domainLib.domainInOtherDomain('example.com', 'com') // true
  jetta.domainLib.domainInOtherDomain('example.com', 'example.com') // true
  jetta.domainLib.domainInOtherDomain('super.sub.example.com', 'example.com') // true
  jetta.domainLib.domainInOtherDomain('not-example.com', 'example.com') // false
  ```

  - Complete documentation can be found in [docs/domain-lib.md](docs/domain-lib.md).

### jetta.makeNestedDirectory `FUNCTION`
  - A simple utility for creating nested directories, creating them where they do not exist
  - Used internally by other jetta features and tests, but exposed for your convenience
  - Example:
  ```js
  jetta.makeNestedDirectory(path.join('example', 'new', 'nested', 'directory'))
  ```

  - Complete documentation can be found in [docs/make-nested-directory.md](docs/make-nested-directory.md).

### jetta.JettaError `CLASS` extends `Error`
  - The global error class used to denote errors generated by jetta
  - Instances contain unique error codes, making them easy to track in the codebase
  - Designed with multi-language support, which helps non-English speakers trace errors
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  - Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).

### jetta.PublicSuffix `CLASS` extends `EventEmitter`
  - A [public suffix list](https://en.wikipedia.org/wiki/Public_Suffix_List) useful for looking up TLDs and eTLDs
  - Automatically updates from provided sources (uses open source sources by default)
  - Example:
  ```js
  const ps = new jetta.PublicSuffix()
  ```

  - Complete documentation can be found in [docs/public-suffix.md](docs/public-suffix.md).

### jetta.request `FUNCTION`
  - Create local and remote-bound requests
  - Built-in support for `http:`, `https:`, `file:`, and `data:` protocols
  - Auto-parse JSON responses, no need for `JSON.parse`/`try/catch` post-callback
  - Saves bandwidth by supporting requests that have multiple levels of compression (`Accept-Encoding`)
  - Built-in checksum generator, generate checksums on the data as the request is being received
  - Custom `engines` support, bring your own support for `http:`, `https:`, `file:`, `data:`, and other protocols that jetta does not yet support
  - Convenient request body handlers for forms, JSON, and streams
  - Makes minimal assumptions - returns the data so that you may decide what to do with it
  - Example:
  ```js
  jetta.request('altusaero.com', (error, results) => {
    // for convenience purposes, 'results.error' is the same as the 'error' param
    console.dir(results, {colors: true})
  })
  ```

  - Complete documentation can be found in [docs/request.md](docs/request.md).

### jetta.requestPromise `FUNCTION`
  - A promise version of `jetta.request`
  - Uses the same options and parameters as `jetta.request`, with the exception of a callback
  - Example:
  ```js
  jetta.requestPromise('altusaero.com').then((results) => {
    console.dir(results, {colors: true})
  }).catch(console.error)
  ```

  - As Promises cannot return multiple parameters, any errors generated will have a `results` attribute
  - `jetta.requestPromise.constants` is the same as `jetta.request.constants`
  - Complete documentation can be found in [docs/request.md](docs/request.md).

### jetta.urlParser `FUNCTION`
  - A utility for parsing and validating URLs
  - Provides options for strict and lax validation
  - Example:
  ```js
  const urlResults = jetta.urlParser('example.com/about/', {addMissingProtocol: true})

  urlResults.isLocalhost // false
  urlResults.isValid // true
  urlResults.parsedURL.protocol // 'https:'
  ```

  - Complete documentation can be found in [docs/url-parser.md](docs/url-parser.md).

<!--
TODO: See more use cases in [examples](examples/).
-->

## Motivation

We wanted a simple, flexible, and easy-to-use request library that didn't compromise on performance and features.
  - Built-in URL validator - we wanted to validate URLs before making requests
  - Return useful statistics, such as time, response headers, options used, and checksum
  - Detailed error messages - Describe exactly where and how things went wrong - not just an Error object
  - Minimize dependencies - less licensing and code to review (for security and legal purposes) & insanely fast installs


## Goals
  - Keep it simple
  - Keep it flexible
  - Keep it fast - its name is _jetta_, as in _jet stream_
  - Keep it secure
  - Keep it lightweight (minimal dependencies)
  - Keep it well-documented
  - Keep tests and code coverage at 100%


## Testing

It is extremely easy to run tests for jetta. From source simply:

```sh
$ npm install
$ npm test
```

See [test/README.md](test/README.md) for more details.


## Credits
  - Forms support inspired by [simple-get](https://github.com/feross/simple-get/)


## Future
  - easy range option support
  - Support more languages for error messages
    - See lib/jetta-error.js

  - See more in [FUTURE.md](FUTURE.md)
