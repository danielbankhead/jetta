# Jetta
## A fast, multi-protocol request library and toolkit ✈️"

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
    throw error // contains an extended details along with multi-language support
  } else {
    // Results contain useful information - including response time, response headers, normalized options, and more
    console.dir(results, {colors: true})
    console.log(results.data.toString())
    // <!DOCTYPE html><html lang="en"><head><meta charset="utf-8">...
  }
})

// Other useful tools:
async function myRequest (url = 'altusaero.com', options = {}) {
  results = await jetta.requestPromise(url, options)
}

const cookieManager = new jetta.CookieManager()
const publicSuffix = new jetta.PublicSuffix()

jetta.urlParser('foo-bar').isValid === false
jetta.urlParser('127.0.0.12').isLocalhost === true
jetta.urlParser('example.com', {addMissingProtocol: true}).parsedURL.href === 'https://example.com/'
```


## Installation

```sh
$ npm install jetta
```


## Features

- Easy to use, feature-rich, with secure defaults
- Requests - fast with useful built-in features:
  - callback and promise support
  - auto-parse JSON responses
  - saves bandwidth by supporting requests that have multiple levels of compression (`Accept-Encoding`)
  - built-in checksum generator
  - custom engine support
  - convenient request body handlers for forms, JSON, and streams
  - makes minimal assumptions - returns the data so that you may decide what to do with it
- Cookie Manager - add, delete, and update cookies with or without making a request
  - generate Cookie and Set-Cookie headers with context (domain, subdomains, path, security, HttpOnly, etc.)
  - built-in public suffix manager - no worries on 'super cookies' being sent any parent domains
  - easy JSON import and export
  - automatically deletes expired cookies
- Public Suffix manager - easy, automated public suffix database manager
  - automatically updates from sources you specify (useful open source defaults are available)
  - easily check against the database
- URL Parser - parse and validate URLs with or without making a request
  - IDN support
- Well-tested with 100% code coverage
- 0 dependencies
  - easy to review the source code for ideas and security purposes


## Quick Start

```js
const jetta = require('jetta')

const myURL = 'https://altusaero.net/images/site/1920x1080/pexels-photo+(15).jpg'
const options = {toFile: 'pexels-photo+(15).jpg'}

jetta.request(myURL, options, (error, results) => {
  if (error !== null) {
    console.error(`${error.code} [${error.lang}]: ${error.message}`)
  } else {
    console.log(`wrote: ${options.toFile}`)
  }
})
```


## Usage

### jetta.defaults `OBJECT`
  - the global default options

### jetta.JettaError `CLASS` (code `STRING`, preferredLanguage `STRING`[, details `OBJECT`]) extends `Error`
  - the global error class used to denote errors generated by jetta
  - instances contain unique error codes (_instance_.code)
  - _instance_.details is always a either an object or string - never `null`
  - _instance_.lang is always present and is a string
  - _instance_.lang is the language of the _instance_'s message
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  - TODO: Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).

### jetta.cookieLib `OBJECT`
  - a utility for parsing, stringifying, and validating cookies.
  - Example:
  ```js
  const cookie = jetta.cookieLib.parseSetCookie('id=example; Domain=example.com; Secure; SameSite')
  ```

  - `alias` are getters and setters
  - ParsedCookieHeader `CLASS`
    - name (alias Name) `STRING`
    - value (alias Value) `STRING`
  - ParsedSetCookieHeader `CLASS`
    - name (alias Name) `STRING`
    - value (alias Value) `STRING`
    - Expires (alias expires) `DATE`
    - Max-Age (alias 'max-age', maxAge) `NUMBER`
      - in seconds, not milliseconds
    - Domain (alias domain) `STRING`
    - Path (alias path) `STRING`
    - Secure (alias secure) `BOOLEAN`
    - HttpOnly (alias 'http-only', 'Http-Only', httpOnly, httponly) `BOOLEAN`
    - SameSite (alias sameSite, samesite) `STRING`<'None','Strict','Lax'>
      - if `BOOLEAN` -> 'Strict'
    ...any other cookie attributes/information will be passed as-is
      - `BOOLEAN` if no value, `STRING` otherwise

  - TODO: OPTIONS
    - mention shared between cookieLib and cookieManager

  - parseCookie `FUNCTION` (cookieString `STRING`[, options `OBJECT`]) -> `ARRAY`<**jetta.cookieLib.ParsedCookieHeader**>
    - Parses the value from a Cookie header into an array of objects - each with (at least) a name and value
    - Example:
      ```js
      TODO: example
      // -> [{name: foo, value: bar}, {name: X, value: Y}, ...]
      ```
  - parseCookieKV `FUNCTION` (cookieString `STRING`[, options `OBJECT`]) -> `OBJECT`
    - Parses the value from a Cookie header into a key-value object, where key is the cookie's name
    - Example:
      ```js
      TODO: example
      // -> {name: value, name: value, ...}
      ```
  - parseSetCookie `FUNCTION` (cookieString `STRING`[, options `OBJECT`]) -> **jetta.cookieLib.ParsedSetCookieHeader**
    - Parses the value from a Set-Cookie header - into an object with various cookie attributes
    - Example:
      ```js
      TODO: example
      // -> {name: foo, value: bar, expires, maxAge, domain, path, ...}
      ```
  - stringifyCookie `FUNCTION` (cookieList `ARRAY`<`OBJECT`>[, options `OBJECT`]) -> `STRING`
    - Stringifies an array of objects - into a value for a cookie header
    - the objects in the array passed to the function may be:
      - **jetta.cookieLib.ParsedCookieHeader**
      - **jetta.cookieLib.ParsedSetCookieHeader**
      - any `OBJECT` with name and value attributes
      - Example:
      ```js
      TODO: example
      // -> foo=bar; X=Y; ...
      ```
  - stringifyCookieKV `FUNCTION` (cookieKeyValues `OBJECT`[, options `OBJECT`]) -> `STRING`
    - Stringifies an object of key-value attributes into a value for a cookie header (where key = cookie's name)
    - Example:
      ```js
      TODO: example
      // -> foo=bar; X=Y; ...
      ```
  - stringifySetCookie `FUNCTION` (cookie `OBJECT`[, options `OBJECT`]) -> `STRING`
    - Stringifies a cookie-like object into a string to be used with a Set-Cookie header
    - Example:
      ```js
      TODO: example
      // -> foo=bar; Path=/; Secure; ...
      ```
  - safeHTTPMethods `OBJECT`
    - An an object of HTTP methods that are considered to be 'safe'
    - Example:
      ```js
      jetta.cookieLib.safeHTTPMethods.GET === true
      jetta.cookieLib.safeHTTPMethods.POST === undefined
      jetta.cookieLib.safeHTTPMethods.UNKNOWN_METHOD === undefined
      ```
  - validCookieNameRegex `REGEXP`
    - A regular expression generated from RFC 6265 Section 4.1.1 for valid cookie names
    - Example:
      ```js
      jetta.cookieLib.validCookieNameRegex.test('example') === true
      jetta.cookieLib.validCookieNameRegex.test('') === false
      jetta.cookieLib.validCookieNameRegex.test('ø') === false
      ```
  - validCookieValueRegex `REGEXP`
    - A regular expression generated from RFC 6265 Section 4.1.1 for valid cookie values
    - Example:
      ```js
      jetta.cookieLib.validCookieValueRegex.test('example') === true
      jetta.cookieLib.validCookieValueRegex.test('') === true
      jetta.cookieLib.validCookieValueRegex.test('a b') === false
      jetta.cookieLib.validCookieValueRegex.test('π') === false
      ```
  - validPathValueRegex `REGEXP`
    - A regular expression generated from RFC 6265 Section 4.1.1 for valid cookie paths
    - Example:
      ```js
      jetta.cookieLib.validPathValueRegex.test('example') === true
      jetta.cookieLib.validPathValueRegex.test('some/path/example') === true
      jetta.cookieLib.validPathValueRegex.test('') === true
      jetta.cookieLib.validPathValueRegex.test('a b') === true
      jetta.cookieLib.validPathValueRegex.test(';') === false
      jetta.cookieLib.validPathValueRegex.test('π') === false
      ```
  - trailingSemicolonRegex `REGEXP`
    - A regular expression for trailing semicolons




  All methods may throw an instance of `JettaError` if something is invalid

  options
    - allowExpiredSetCookie BOOL
      - If allowed, Set Cookie will not throw if Expires or Max Age signifies that something has expired
    - fromHttpApi BOOL
      - Should be false if from "non-HTTP API" according to RFC 6265.
      - Here are some examples from RFC 6265 as to what this means:
        - a web browser API that exposes cookies to scripts
        - HTML's `document.cookie` API
    - isSecureEnv BOOL
      - the request is made in a secure environment, such as HTTPS
    - isTopLevelBrowsingContext BOOL
      - `Top-level means that the URL in the address bar changes because of this navigation. This is not the case for iframes, images or XMLHttpRequests.`
    - preferredErrorLanguage STRING
    - publicSuffix OBJECT
      - a PublicSuffix instance (or compatible object) used for checking against if public suffix
      - if NULL or not given, public suffixes will not be checked (and ignored)
    - requestMethod STRING
      - the request's HTTP method
    - requestURL STRING
      - the URL in which the request is for (as in the site to sending or to receive the cookies)
    - thirdPartyCookiesAllowed BOOL
      - When topLevelURL !== null, this allows third-party cookies when cookie's domain does not match the hostname of the topLevelURL
    - topLevelURL STRING
      - the topLevelURL of the request
        - NOTE: for example, iframe, etc.
      - can be domain or full URL
      - this will be used as "site for cookies" internally
        - consider nested iframes and sandboxing rules - [Same-Site Cookies (Draft) Section 2.1](https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-2.1) (and subsections) of the draft may help you determine what this should be

  For 100% cross-platform compatibility there is no built-in encoder/decoder for cookie names & values (most US-ASCII characters are accepted). You can easily use `decodeURIComponent` and `encodeURIComponent` where necessary and can test via `cookie.validCookieNameRegex`, `cookie.validCookieValueRegex`, and `cookie.validPathValueRegex` (the parse* and stringify* functions use these static methods).




  - Complete documentation can be found in [docs/cookie-lib.md](docs/cookie-lib.md).

### jetta.CookieManager
  - add, delete, and update cookies with or without making a request
  - generate Cookie and Set-Cookie headers with context (domain, subdomains, path, security, HttpOnly, etc.) via options
  - internally checks cookie domains against built-in public suffix instance (TODO: link)
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  INSTANCE
    - add, delete, and update cookies
    - generate cookie header strings with context (domain, subdomains, path, security, HttpOnly, etc.)
    - built-in public suffix manager - no worries on 'super cookies' being sent any parent domains
    - easy import and export, including public suffix database
    - automatically deletes expired cookies
    - is an event emitter
      - ready
      - error JettaError
      - addedCookie cookieObject
        - when a cookie has been successfully added via `addCookie`
      - deletedCookie cookieObject
        - when a cookie has been successfully deleted via `deleteCookie`
      - updatedCookie cookieObject
        - when a cookie has been successfully updated via `addCookie`
      - updatedPublicSuffix
        - when public suffix has been updated

      - NOTE: does not have to wait, nor listen, to 'ready' event if only being used for requests (the request(s) will wait on it for you)

      cookieObject
        name STRING
        value STRING
        domain STRING
        path STRING
        'expiry-time' NULL || timestamp in milliseconds
        'creation-time' timestamp in milliseconds
        'last-access-time' timestamp in milliseconds
        'persistent-flag' BOOL (is session cookie if this === false)
        'host-only-flag' BOOL ((exact) same host only i.e. (no subdomains))
        'secure-only-flag': BOOL (can only be sent over secure channels)
        'http-only-flag': false,
        'samesite-flag': 'None'

  NOTE: publicSuffix instance > publicSuffixOptions
    NOTE: can pass an existing public suffix instance (ready or not) - cookie manager uses it under the hood
    NOTE: saves RAM, storage, processing time/power, etc. as it can be shared across many cookieManager instances

    TEST: preferred error language inheritance on publicSuffixOptions, but not if publicSuffix === instance

  EXPORT
    - returns JSON-stringifyable object
    - doesn't need to wait for 'ready'
    - saves session cookies by default
      - NOTE: if you do not want to save session cookies use this.deleteSessionCookies() before export
    - saves publicSuffixOptions, but not publicSuffix itself
    - pass import cookie data by passing exported data CookieManager constructor

  addCookie
    NOTE: throws if publicSuffix is not ready, error with stringifyCookie() (such as invalid cookie params), or if any passed URLs are invalid
  deleteCookie
  deleteExpiredCookies
  deleteSessionCookies
  generateCookieHeader
    NOTE: throws if error with stringifyCookie or if any passed URLs are invalid
    requestURL can be string or object
    NOTE: a public suffix URL should be ok if set with public suffix
  getCookie
    returns a single cookie || NULL
  getCookies
    filtering cookie search & a way to get all cookies as a list of objects
    filters: {name STRING, domain STRING, path STRING}
      - empty-string or missing filter attribute === all (for that field)
      - exact-match if not an empty string

  "isTopLevelBrowsingContext" means that the document that is requesting the cookie does not have a parent context (which means it is nested). Example: an iframe within a window is not a top-level browsing context



  - Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).

### jetta.domainLib
  - A utility for comparing and analyzing domains
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  - Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).

### jetta.makeNestedDirectory
  - A simple utility for creating nested directories, creating them where they do not exist
  - Used internally by other jetta functions, but exposed for your convenience
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

### jetta.PublicSuffix
  - the global error class used to denote errors generated by jetta
  - instances contain unique error codes,
  - _instance_.details is always a either an object or string - never `null`
  - _instance_.lang is always present and is a string
  - _instance_.lang is the language of the _instance_'s message

  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  // NOTE: Mention/doc: https://publicsuffix.org/list/ & https://github.com/publicsuffix/list
    // NOTE: cache for up to 24 hours (default)
    // NOTE: can use setupIndex and updateFromSources to manually update
    // NOTE: setupIndex does not update 'lastUpdated'
    // NOTE: can get suffix String via `.list` -> useful for when not using `options.path`
    // NOTE: if you want to delete the publicSuffix instance before the process/script has ended use publicSuffix.destroy()
      // NOTE: update timer will be cleared, all values set to null, and thus no more events will be fired
      // NOTE: does not delete or mutate the any saved data in `path`

    // NOTE: `As a best practice, listeners should always be added for the 'error' events.` - node doc


  // emits
    // 'ready' (no arguments)
    // 'updatedPublicSuffix' (no arguments)

  // options
    cacheLimit: NUMBER (in ms) || Infinity
      cacheLimit === Infinity
        - no automatic updates
        - initial update if no list (null or empty string) && path !== exist
    exceptionsIndex: the index for negations object - will be generated automatically
    index: the index object - will be generated automatically
    lastUpdated: DATE || NUMBER (in ms) (overwritten when reading from file)
    list STRING || NULL
      if used, will not use nor update path
    path STRING || url.URL
      if used, will write to file upon updates
      will update 'list' upon parse and updates
      can be a string or WHATWG URL object
    preferredErrorLanguage STRING
    ready: false,
    sources ARRAY<OBJECT|STRING>
      - URLs that can be passed to request to retrieve a public suffix list
      - URL can be any valid URL argument for request<TODO: LINK>
      - since request can handle local and remote requests, this can be local or remote location
      - goes through list in order, falls back to the next source in the list
        - if any one suceeds, then no error will be for any failed previous sources emitted and will the use the source that works
        - else, emits a single, collective JettaError<TODO: LINK> with a details (OBJECT) attached with what went wrong per source
    updating: false,
    updateTimeout: null



  - Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).

### jetta.request
  - the global error class used to denote errors generated by jetta
  - instances contain unique error codes,
  - _instance_.details is always a either an object or string - never `null`
  - _instance_.lang is always present and is a string
  - _instance_.lang is the language of the _instance_'s message

  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  - Complete documentation can be found in [docs/jetta-error.md](docs/jetta-error.md).


  MERGE-OVERWRITE default:
    checksum
    engines
    redirectsPreserveHeader
    requestOptions
    requestOptions.headers
    secureProtocols
    urlParser

  url, options - never mutated
    - except for cookieManager, which is natural
  always async, even if results are immediately available (such as `data:` requests)


  redirectsPreserveHeader
    Authorization
    Cookie
      - Note that cookieManager would have preference over this option
    Referer
      - if `options.redirectsUpdateReferer` option is true, then this would be overwritten
      - never sent on secureToNonSecureProtocol, even with redirectsUpdateReferer === true


  options.requestBodyStream, options.body, options.json, options.form
    - should not be used in conjunction with [the others]

  redirectsUpdateReferer
    Read more about the pros/cons of the `Referer` header from the [RFC 7231 Section 5.5.2](https://tools.ietf.org/html/rfc7231#section-5.5.2). Here are a few:
      - pros:
        - helps prevent CSRF attacks
        - required for some sites to verify logins
      - cons:
        - reveals request browsing history (privacy)/tracking
        - some sites may deny links from other sites

    requestOptions.headers.Referer are always removed on redirects


  results.options.requestBodyStream: to prevent errors, won't be passed to any redirects

  results.options.onResponseData = `(data, results) => {}`
    - decompressed data
      - NOTE: except where
    - useful for streaming and reducing RAM usage

    - can check the current state of the results with `results` so that you can make decisions on the received data
      - such as if the data was decompressed and what with
      - if there were any redirects `results.redirects` (may want to empty the existing results)
        // results.redirects is an Array of results in redirect order
    - streams, therefore may be called multiple times
    - while asynchronous, this will be guaranteed to be called before the main callback (so you won't have to worry about missing data at the end), if there is any data to be received/processed
    - on end the main callback will be called, whether an error occurred or not
    - // NOTE: the response will also return the data as usual (via results.data), unless storeDataInResults === false


  options.storeDataInResults BOOLEAN
    - concat response data to return as `results.data`
    - a few use cases where
      - `options.onResponseData` or `options.toFile` have been used (to create a stream-only request)
      - for large requests that may not fit in RAM all at once and `options.dataLimit` is set to a high value relative to available RAM
      - not interested in the response payload itself, but rather if the request succeeded or not
    - decompressed/decoded by default, unless `Accept-Encoding` header was used in request (see `results.dataEncoding`)

  results.time
    total (in MS)
    request (in MS)
    requestResponse (in MS)

  All options have a counterpart in 'defaults.json'

  engines
    `{protocol: function}`
    Want to use a custom engine, like the Electron's [net](https://electron.atom.io/docs/api/net/) module?

    Should be compatible with Node.js's `http.request` structure

  Space = cookie manager + redirectUpdateReferer option
    - isolated per space


  options.checksum
    - results in an error if Accept-Encoding...


  TODO: checksum file generator (no data, just use storeDataInResults === false):
    code example
    - data
    - file
    - url


  // fs.statSync('1073741824-bytes-of-0.gzip.gzip.gzip')

  // b = zlib.gunzipSync(zlib.gunzipSync(zlib.gunzipSync(fs.readFileSync('1073741824-bytes-of-0.gzip.gzip.gzip'))))
  // b.length === 1073741824


  Settings before sign-in sync?
    - space limit/disable
    - cookie

  Allow cookies to be shown on app-level
  - domain (count)
    - details...
    - edit option?
      - no

  - Notice: cookies are sandboxed per space

  - 1MB per space
  - "disable cookies in space" option

  "maxCookieByteLength": 8192 // NUMBER
    throws cookie too large error
  "maxCookies": 16384 // NUMBER
    delete the domain that's taking up the most space (JSON.stringify)
    TEST: count > cookie size
  "maxCookiesPerDomain": 1024 // NUMBER

    // https://tools.ietf.org/html/rfc6265#section-5.3
      - MAY "remove excess cookies"

    1.  Expired cookies.
    2.  Cookies that share a domain field with more than a predetermined
        number of other cookies.
    3.  All cookies.

  // NOTE: mention use cookie, cookieManager or cookie header (which can be created via created via cookie manager) to set cookies
    // CookieManager > cookie > Cookie Header
    // cookie = key-value convenience option

    // NOTE: You can immediately use requests - the request will wait for the cookieManager to setup
    // NOTE: use cookieManager to save cookies between requests
    // NOTE: you can create a 'disposable' cookie manager instance for requests if you want enhanced privacy
  // NOTE: toFile (full or partial path, or FILE URL) uses last request and will overwrite an existing file
    // NOTE: streams the file - no worries on memory usage
    // NOTE: the response will also return the data as usual (via results.data), unless storeDataInResults === false

  // TEST: actual data received should raise an error with decompress being higher (avoid zip, gzip, etc. bombs)
  // TEST: exact on limits should be ok
  // TEST: Internationalized Domain Name (IDN) support
  // TEST: Handles Data URI scheme (`data:`)
  // TEST: Handles File URI scheme (`file:`)
  // TEST: responses should always be async

  // NOTE: automatically decompresses whenever possible
  // TEST: no encoding should always be fine
  // NOTE: Accept-Encoding === null OR string
    // if not a string, then all encodings are accepted
    // Decompress others, like Brotli, via`options.onResponseData` https://en.wikipedia.org/wiki/Brotli

  // results.dataEncoding
    // the encoding of the data, if not internally decoded/decompressed. By default this should always be null unless an jetta-unsupported encoding has been set with the request's `Accept-Encoding` header and an jetta-unsupported encoding has been received in the request
    If not null, should be an Array in order of which the encodings were applied from the server

  - auto-parse json response
    - not available for `storeDataInResults === false`
      - NOTE: works for data: protocol as well


  Why not use responseStreams instead of onResponseData?
    - redirects
      - makes piping a bit more complex for users to digest
    - handling of data with 0
    - simplicity/compatibility with callback and promise-based request
    - makes other build-in features, such as decompression and checksums, more complicated
    - perhaps an 'onResponseStreamAvailable' that returns a stream per internal request


  request headers If-Modified-Since or If-None-Match
    // may get 'jetta-request-bad-response-code' error && 304 && body results.lengths.data === 0
      // means 'use existing cache'


  - 307 & 308
    - carries request body through redirect
    - requestStream may fail










    Auth (Authorization) preferred order:
      - auth from redirect's URL
      - Authorization header from URL that received the redirect (if redirectsPreserveHeader option allows)
      - auth from URL that received the redirect sameSite redirect
      - none

    Referer resolution
      - none if any of the following are true:
        - If redirecting from localhost
        - Original protocol was 'data:'
        - Original protocol was 'file:'
        - If redirecting from a secure protocol to a non-secure protocol (as determined by the `secureProtocols` option)
      - if options.redirectsUpdateReferer === true
        - use, removing any auth (user:pass) & hash (#hash) from the URL
      - Referer header from URL that received the redirect (if redirectsPreserveHeader option allows)
      - none

    if samesite redirect
      - retains requestOptions.socketPath, if used
      - retains cookie option, if used
        - cookieManager is kept regardless as it has for request context

    if 307 & 308 redirect
      retain body, form, json, & requestBodyStream options
        - requestBodyStream will fail on redirect - since it has been streamed

    options.toFile - last request and will overwrite an existing file

    The 'redirectsPreserveHeader' option preserves headers on redirect
      can be conveniently set as ALWAYS, SAMESITE, or NEVER

      - const {ALWAYS, SAMESITE, NEVER} = makeRequest.constants.redirectsPreserveHeader



### jetta.requestPromise
  - A promise version of `jetta.request`
  - Uses the same options and parameters, with the exception of a callback
  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

### jetta.urlParser
  - A utility for parsing and validating URLs

  Effectively never throws, even on ill-formatted/invalid URLs as it internally catches any errors and returns isValid === false

  - Example:
  ```js
  const error = new jetta.JettaError('jetta-cookie-invalid-name', 'en')
  ```

  {ipAddressesAllowed: false, localhostAllowed: true}, means no https://127.0.0.1, https://[::1], but 'localhost' is fine


See more use cases in [examples](examples/).

## Motivation

We wanted a simple, flexible, and easy-to-use request library that didn't compromise on performance and features.
  - Built-in URL validator - we wanted to validate URLs before making requests
  - Return useful statistics, such as time, response headers, options used, and checksum
  - Detailed error messages - Describe exactly where and how things went wrong - not just an Error object
  - Minimize dependencies - less licensing and code to review (for security and legal purposes) & insanely fast installs


## Goals
  - keep it simple
  - keep it flexible
  - keep it fast - its name is _jetta_, as in _jet stream_
  - keep it secure
  - keep it lightweight (minimal dependencies)
  - keep it well-documented
  - keep tests and code coverage at 100%


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
