### jetta.request `FUNCTION`
  - Create local and remote-bound requests
  - Built-in support for `http:`, `https:`, `file:`, and `data:` protocols
  - Auto-parse JSON responses, no need for `JSON.parse`/`try/catch` post-callback
  - Saves bandwidth by supporting requests that have multiple levels of compression (`Accept-Encoding`)
  - Built-in checksum generator, generate checksums on the data as the request is being received
  - Custom `engines` support, bring your own support for `http:`, `https:`, `file:`, `data:`, and other protocols that jetta does not currently support
  - Convenient request body handlers for forms, JSON, and streams
  - Makes minimal assumptions - returns the data so that you may decide what to do with it
  - Example:
  ```js
  jetta.request('altusaero.com', (error, results) => {
    // results contain the error as 'results.error'
      // the 'error' param is for convenience and compatibility
    console.dir(results, {colors: true})
  })
  ```

  _`jetta.request*` represents both `jetta.request` and `jetta.requestPromise` throughout this document_

  - jetta.request(`url` OBJECT | STRING[, `options` OBJECT], `callback` FUNCTION)
    - All options are optional (defaults can be found in `jetta.defaults.request`)
    - Uses `jetta.urlParser` internally, which has Internationalized Domain Name (IDN) support
    - Automatically decompresses data by default. See [Decompression and Encodings](#decompression-and-encodings) for more information.

    - `url` OBJECT | STRING - the URL for the request
      - Will be parsed via `jetta.urlParser`
      - Can be set to `null` if essential request information, such as hostname and protocol, are provided via `options.requestOptions`

    - `options` OBJECT _optional_
      - Options for the request
      - For your convenience the following options merge with the defaults, rather than completely overwriting them:
        - `checksum`
        - `engines`
        - `redirectsPreserveHeader`
        - `requestOptions`
        - `requestOptions.headers`
        - `secureProtocols`
        - `urlParser`
        - Example:
          ```js
          const checksum = {
            algorithm: 'sha384'
          }

          jetta.request('altusaero.com', {checksum}, (error, results) => {
            assert(results.options.checksum.algorithm, checksum.algorithm)
            assert(results.options.checksum.digest, 'hex')

            console.log('checksum option merge ok')
          })
          ```

      - `agents` OBJECT | `null` - a key-value object of agents to use for the request.
        - The key is the protocol, including colon, while the value is the agent for that protocol.
        - Example:
          ```js
          const agents = {
            'http:': new http.Agent(),
            'https:': new https.Agent()
          }

          jetta.request('altusaero.com', {agents}, (error, results) => {/*...*/})
          ```
      - `body` BUFFER | `null` - a body to send with the request
        - Sets `options.requestOptions.method` to 'POST' if no method has been set
        - Determines and sets `options.requestOptions.headers['Content-Length']` if the header has not been set
        - Not recommended for use with `options.form`, `options.json`, or `options.requestBodyStream`
      - `cookie` OBJECT | `null` - a key-value object to generate a Cookie header for the request
        - Updates `options.requestOptions.headers.Cookie`
        - Example:
          ```js
          const cookie = {
            'id': '1503007806947-0-10592-example-0543adbfc6c7836b8963-2a',
            'lang': 'en'
          }

          jetta.request('altusaero.com', {cookie}, (error, results) => {/*...*/})
          ```
      - `cookieManager` COOKIEMANAGER | `null` - a `jetta.CookieManager` instance
        - Used to handle cookies for the request and any redirects
        - Useful for creating an enduring cookie storage
        - Waits for manager to be ready, if not ready
        - Using this option overwrites `options.cookie` and `options.requestOptions.headers.Cookie`
        - Example:
          ```js
          const cookieManager = new jetta.CookieManager()

          jetta.request('altusaero.com', {cookieManager}, (error, results) => {/*...*/})
          ```
        - You can create a 'disposable' `jetta.CookieManager` instances for enhanced privacy by creating unique instances per request
        - See [cookie-manager.md](cookie-manager.md) for more information
      - `checksum` OBJECT | `null` - generates a checksum on the received data from the request
        - Works will all protocols, including `data:` and `file:`
        - The resulting checksum will be available via `results.checksum`
        - Can be used in conjunction with other options, including `onResponseData`, `toFile`, and `storeDataInResults`. For example, set `storeDataInResults` to `false` if you're only interested in receiving the checksum of the data, but not the data itself.
        - `algorithm` STRING - a hash algorithm supported by Node.js
          - Run `crypto.getHashes()` to get supported list
        - `digest` STRING _optional_ - the method to digest the checksum buffer.
          - Usually set to 'hex' or 'base64'.
        - `expected` STRING _optional_ - the expected result
          - If used will throw an error if the checksums do not match.

        - Naturally, checksums are not supported on encoded data - using this option and enabling non-supported encodings may result in an error. See [Decompression and Encodings](#decompression-and-encodings) for details.
      - `dataLimit` INTEGER - the maximum amount of data received before aborting the request
        - This is considered before and after any decompression is used - to ensure protection against [zip bombs](https://en.wikipedia.org/wiki/Zip_bomb)
      - `engines` OBJECT | `null` - a key-value object of the custom engines to use for the request
        - The key is the protocol, including colon, while the value is the function used to create the request.
        - Useful for adding support for unsupported protocols in jetta, or modifying existing ones
          - Such as using Electron's [net](https://electron.atom.io/docs/api/net/) module for extended proxy support
        - The function's API should match Node.js's `http.request` functionality
        - Example:
          ```js
          engines: {
            'http:': http.request,
            'https:': specialHTTPSRequestFunction,
            'super-new-protocol:': superCoolNewProtocol
          }

          jetta.request('super-new-protocol://here/we/go', {engines}, (error, results) => {/*...*/})
          ```

        - This can be added directly to jetta's test suite for convenient compatibility checking. See [../test/README.md](../test/README.md) for details.
      - `form` OBJECT | `null` - a form body to convert to a querystring and send with the request
        - Sets `options.requestOptions.headers['Content-Type']` to 'application/x-www-form-urlencoded' if the header has not been set
        - Sets `options.requestOptions.method` to 'POST' if no method has been set
        - Determines and sets `options.requestOptions.headers['Content-Length']` if the header has not been set
        - Not recommended for use with `options.body`, `options.json`, or `options.requestBodyStream`
      - `json` OBJECT | `null` - a JSON body to convert to stringify and send with the request
        - Sets `options.requestOptions.headers['Content-Type']` to 'application/json' if the header has not been set
        - Sets `options.requestOptions.method` to 'POST' if no method has been set
        - Determines and sets `options.requestOptions.headers['Content-Length']` if the header has not been set
        - Not recommended for use with `options.body`, `options.form`, or `options.requestBodyStream`
      - `onResponseData` (data BUFFER, results OBJECT) - streams data as it is received from the request
        - Useful for streaming and reducing RAM usage
        - May be called multiple times as data is being received
        - Works with all protocols, including `data:` and `file:`
        - `data` is decompressed, except where 'Accept-Encoding' is non-default
          - See [Decompression and Encodings](#decompression-and-encodings) for more information on this
        - While asynchronous, this will be guaranteed to be called before the main callback if there is any data to be received/processed. This way you will not have to worry or plan for missing data.
        - Can check the current state of the `results` so that you can make decisions on the received data, such as:
          - Checking `results.dataEncoding`
            - Useful custom decoding support, such as 'brotli'
            - See [Decompression and Encodings](#decompression-and-encodings) for more information on this functionality
          - Checking `results.redirects` for any redirects (may want to empty the existing payload if there was a redirect)
        - On end the main callback will be called, whether an error occurred or not
        - Can be used in conjunction with `options.storeDataInResults` and `options.toFile`
        - See [Readable Response Streams vs `onResponseData`](#readable-response-streams-vs-onresponsedata)
      - `preferredErrorLanguage` STRING - as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
        - See `jetta.JettaError` for details
      - `redirectLimit` INTEGER - the max number of redirects before aborting the request
      - `redirectsPreserveHeader` OBJECT | `null` - determines which headers are preserved on redirect
        - Can be conveniently set as `ALWAYS`, `SAMESITE`, or `NEVER` via `jetta.request.constants.redirectsPreserveHeader`
        - Example:
          ```js
          const {ALWAYS, SAMESITE, NEVER} = jetta.request.constants.redirectsPreserveHeader

          const redirectsPreserveHeader = {
            Accept: ALWAYS,
            Authorization: SAMESITE,
            DNT: ALWAYS
          }

          jetta.request('altusaero.com', {redirectsPreserveHeader}, (error, results) => {/*...*/})
          ```
        - Notes for the following headers:
          - Authorization: See 'Auth (Authorization) preferred order' in the [Redirects](#redirects) section
          - Cookie: `options.cookieManager` would have preference over this option
          - Referer: See 'Referer header resolution' in the [Redirects](#redirects) section
      - `redirectsUpdateReferer` BOOLEAN - determines if jetta should update the Referer header on redirects
        - See 'Referer header resolution' in [Redirects](#redirects) section
        - Read more about the pros/cons of the `Referer` header from the [RFC 7231 Section 5.5.2](https://tools.ietf.org/html/rfc7231#section-5.5.2). Here are a few:
          - Pros:
            - Helps prevent CSRF attacks
            - Required for some sites to verify logins
          - Cons:
            - Reveals request browsing history (privacy)/tracking
            - Some sites may deny links from other sites
      - `requestOptions` OBJECT | `null` - the request options to use for the native request
        - All [Node.js request options](https://nodejs.org/api/http.html#http_http_request_options_callback) are supported. See the API docs for the complete list.
        - The `requestOptions.headers` object will be separately merged so that useful defaults may persist
      - `requestBodyStream` _instanceof_ `stream.Readable` | `null` - a readable stream to send to the server
        - Useful for large uploads, whether it be MBs, GBs, or TBs of data
        - Sets `options.requestOptions.headers['Transfer-Encoding']` to 'chunked'` if the header has not been set
        - Sets `options.requestOptions.method` to 'POST' if no method has been set
        - Not recommended for use with `options.body`, `options.form`, or `options.json`
      - `secureProtocols` OBJECT | `null` - a key-value list of protocols, with their colon, that are deemed 'secure'
        - The value must be set to `true`. Setting to `false` overwrites the defaults for that particular protocol.
        - Used internally for redirects, cookies, and Referer header. See [Redirects](#redirects) for more information.
        - Example:
          ```js
          const secureProtocols = {
            'https:': true
          }
          jetta.request('altusaero.com', {secureProtocols}, (error, results) => {/*...*/})
          ```
      - `storeDataInResults` BOOLEAN - determines if the data to be concatenated and stored in the `results` object
        - A few use cases where this may be set to `false`:
          - If you do not want the data to be stored in RAM
          - `options.onResponseData` or `options.toFile` have been used (to create a stream-only request)
          - For large requests that may not fit in RAM all at once and `options.dataLimit` is set to a high value relative to available RAM
          - Not interested in the response payload itself, but rather if the request succeeded or not
        - Setting to `false` disables automatic JSON-parsing
        - If `true` the data in `results.data` is decompressed by default. See [Decompression and Encodings](#decompression-and-encodings) for more information.
      - `timeLimit` INTEGER - the time limit, in milliseconds, before the request times out
        - A timeout can occur during the request initialization or if no data has been received
      - `toFile` STRING | _instanceof_ `url.URL` | `null` - saves the response data to a file
        - Streams to a file as the data is received - no worries on memory usage
          - Perfect for large downloads
        - Can be used in conjunction with `onResponseData` and `storeDataInResults`
        - If _instanceof_ `url.URL`, must use the `file:` protocol
        - If any redirects, will use last request
        - Will overwrite an existing file
      - `urlParser` OBJECT | `null` - options to pass to `jetta.urlParser` when processing URLs
        - Example:
          ```js
          const urlParser = {
            "addMissingProtocol": true
          }
          jetta.request('altusaero.com', {urlParser}, (error, results) => {/*...*/})
          ```

    - `callback` (`error` _instanceof_ `jetta.JettaError` | `null`, `results` OBJECT)
      - The completed request, where `error` is an instance of `jetta.JettaError`
      - See [Response Results](#response-results) for the values in the `results` object

  - `jetta.request.constants` OBJECT
    - An object with constant objects and values
    - Should rely on the constant's key, not value, as the value may change in the future

    - `redirectsPreserveHeader` OBJECT
      - `ALWAYS` INTEGER
        - Denotes that the the header set with this value should always be set on redirects
      - `NEVER` INTEGER
        - Denotes that the the header set with this value should never be set on redirects
      - `SAMESITE` INTEGER
        - Denotes that the the header set with this value should be set on redirects if it is a same-site redirect


#### Response Results
`results` is an object that always contain the following, even from `options.onResponseData`:
  - `results.checksum` STRING | `null` - the checksum generated, if `options.checksum` has been used
  - `results.data` BUFFER | `null` - the response body
    - Always `null` if `options.storeDataInResults` is set to `false`
  - `results.dataEncoding` ARRAY | `null`
    - See [Decompression and Encodings](#decompression-and-encodings)
  - `results.error` _instanceof_ `jetta.JettaError` | `null` - an error with the request, `null` if no error occurred
    - Same value as the 'error' parameter from the callback
  - `results.json` OBJECT | `null` - the parsed JSON response body
    - Works natively for the `data:`, `http:`, and `https:` protocols where the proper content-type is available
    - Always `null` if `options.storeDataInResults` is set to `false`
  - `results.lengths` OBJECT
    - `results.lengths.content` NUMBER
      - The Content-Length header value as a Number
      - May be a valid number or `NaN`
    - `results.lengths.data` INTEGER
      - The length of the received data
      - Always a safe integer, even if an error has occurred
    - `results.lengths.decompressed` INTEGER
      - The amount of data decompressed
      - Always a safe integer, even if an error has occurred
    - `results.lengths.response` INTEGER
      - The amount of data received from the response payload, usually compressed, which means this may be lower than `results.lengths.data`
      - Useful for comparing compression ratios
      - Always a safe integer, even if an error has occurred
  - `results.options` OBJECT
    - The normalized options used.
    - `results.options.checksum` OBJECT - never `null`
    - `results.options.engines` OBJECT - never `null`
    - `results.options.redirectsPreserveHeader` OBJECT - never `null`
    - `results.options.requestOptions` OBJECT - never `null`
    - `results.options.secureProtocols` OBJECT - never `null`
    - `results.options.urlParser` OBJECT - never `null`
  - `results.redirects` ARRAY<OBJECT>
    - The results from previous redirects in the order in which they were received
    - Useful for tracing and debugging
    - Every object in `results.redirects` is a valid `results` object
  - `results.responseHeaders` OBJECT | `null` - the headers from the response, [lowercased internally](https://nodejs.org/api/http.html#http_http) by Node.js
  - `results.statusCode` NUMBER - the status code of the response
    - May be `NaN`
  - `results.time` OBJECT - never `null`
    - `results.time.total` INTEGER
      - The total request time in milliseconds
      - Available even if an error has occurred
      - Always a safe integer
    - `results.time.request` NUMBER
      - The total time for the most recent request in milliseconds
        - 'Most recent' meaning if there were any redirects, this is the time for the last redirect
      - May be `NaN`
    - `results.time.requestResponse` NUMBER
      - The total response time for the most recent request in milliseconds
      - If is a safe integer, always equal to or less than `results.time.request`
      - May be `NaN`
  - `results.url` OBJECT
    - The results from `jetta.urlParser`
    - `results.url.isLocalhost` BOOLEAN
    - `results.url.isValid` BOOLEAN
    - `results.url.options` OBJECT - never `null`
    - `results.url.parsedURL` OBJECT - never `null`
    - `results.url.url` STRING


#### Decompression and Encodings

`jetta.request*` automatically decompresses data by default, including requests with multiple values for their [Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) headers. By default unsupported encodings result in an error. This is done so that users do not have to perform additional checks and guesswork on the response data - one may safely use `options.checksum`, `options.onResponseData`, `options.toFile`, `results.data`, and `results.json` without a second thought.

To accept unsupported encodings set the 'Accept-Encoding' header in `options.requestOptions.header` accordingly. If Accept-Encoding contains a non-supported encoding, such as 'brotli', and the server sends that encoding in the response jetta will not perform any decoding and will set `results.dataEncoding` to an array of encodings (strings) in order of which they were applied from the server.

#### Guarantees

We've created and test for a list of guarantees so that you may always have consistent, reliable data:
  - Final callback is always called once.
  - An `error` is always an instance of `jetta.JettaError` or `null`.
  - `url` and `options` are never mutated
    - Except for `options.cookieManager`, which is natural as it updates your cookies
  - Always returned asynchronously, even if results are immediately available (such as `data:` requests)
  - `results` as defined in the [Response Results](#response-results) section

If we ever need to change these guarantees, we will issue a major release.
See [../test/README.md](../test/README.md) for how we accomplish and maintain these guarantees.

#### Determining 'same site'

`jetta.request` uses `jetta.domainLib` internally to determine if a site is 'same site' (mainly for redirect purposes)

#### Redirects

Sometimes redirects can be a bit tricky to determine handle and predict. This section should shed some light on areas where things are usually complicated.

Status codes 307 & 308 carry request body (`options.body`, `options.form`, `options.json`, `options.requestStream`) through redirect
  - Note that `options.requestStream` may fail, as it would have been streamed

Auth (Authorization) preferred order:
  - 'auth' attribute from redirect's URL
  - Authorization header from URL that received the redirect (if `options.redirectsPreserveHeader` option allows)
  - 'auth' attribute from URL that received the redirect sameSite redirect
  - None

Referer header resolution:
  - None, if any of the following are true:
    - If redirecting from localhost
    - Original protocol was `data:`
    - Original protocol was `file:`
    - If redirecting from a secure protocol to a non-secure protocol (as determined by the `secureProtocols` option)
  - If `options.redirectsUpdateReferer` is set to `true`
    - Use, removing any auth (user:pass) & hash (#hash) from the URL
  - Referer header from URL that received the redirect (if `options.redirectsPreserveHeader` option allows)
  - None

If samesite redirect:
  - Retains requestOptions.socketPath, if used
  - Retains `options.cookie` option, if used
    - `options.cookieManager` is kept regardless as it has for request context

If using request headers 'If-Modified-Since' or 'If-None-Match' you may receive 'jetta-request-bad-response-code' with a 304 error. If this happens, the server is telling you to 'use existing cache' as described by the header provided. This isn't necessary an 'error', but it is clearer to understand than for `jetta.request*` to not return an error and for you to perform guesswork.

#### Readable Response Streams vs `onResponseData`

We use `options.onResponseData` over returning a readable stream for the following reasons:
  - It complicates redirects. For example, how should `readable.pipe(...)` work?
  - Handling requests without a response body is a bit more straight-forward
  - Simplicity/compatibility with callback and promise-based `jetta.request*`
  - Using streams makes other build-in features, such as decompression and checksums, more complicated as it would have to be double-piped and checking for errors in more places

Our primary goals with jetta is to make requests simple to create, data easy to digest, and debugging super simple. While we have a list of drawbacks, we are not totally closed to the idea of a response stream and are open to suggestions.
  - Perhaps an `options.onResponseStreamAvailable` that returns a readable stream per internal request would suffice
