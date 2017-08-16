### `jetta.request` (url[, options], callback[, currentRedirects])
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

  - `url` STRING | OBJECT
    - The URL for the request to be parsed by `jetta.urlParser` (as the `candidate` argument)
    - Can be set to `null` if you want to pass options directly
      - Useful if using `socketPath` in `options.requestOptions` for UNIX Domain Sockets or Named Pipes on Windows

  - `options` OBJECT _optional_
    - Defaults can be found in `jetta.defaults.request`

    - `body` STRING | BUFFER
      - Set the body of the request
      - If STRING, must be UTF-8
      - If BUFFER, will be written to the request

      - _Infers_:
        - `headers['content-length']` (determined by `Buffer.byteLength()`)
        - `method`: POST

      - _Recommended_: set `options.headers['content-type']`

    - `cookies` OBJECT
      - An object with cookies to be used as a header
      - Example:
      ```js
      const options = {
        cookie: {
          cat: 'meow',
          dog: 'bark',
          foo: 'bar'
        }
      }
      ```

      - _NOTE_: Can directly set via headers.
        - Example:
        ```js
        const options = {
          headers: {
            cookie: 'cat=meow; dog=bark; foo=bar'
          }
        }
        ```

    - `dataLimit` INTEGER
      - A data limit in bytes

    - `form` OBJECT
      - Sends a form in the request
      - Example:
      ```js
      const options = {
        form: {
          name: 'Dan',
          email: 'dan@example.com'
        }
      }
      ```

      - _Infers_:
        - `headers['content-length']` (determined by `Buffer.byteLength()`)
        - `headers['content-type']`: 'application/x-www-form-urlencoded'
        - `method`: POST

    - `headers` OBJECT
      - Headers to use in the request

    - `json` OBJECT
      - Send a JSON request
      - Example:
      ```js
      const options = {
        json: {
          name: 'Dan',
          details: {
            email: 'dan@example.com',
            favoriteIceCream: 'chocolate'
          }
        }
      }
      ```

      - _Infers_:
        - `headers['content-length']` (determined by `Buffer.byteLength()`)
        - `headers['content-type']`: 'application/json'
        - `method`: POST

    - `preferredErrorLanguage` STRING
      - The preferred language for any error messages that may occur.
      - Should be an ISO 639-1 code, such as 'en' for English and 'fr' for French
      - Falls back to English if preferred language unavailable

    - `progressLog` OBJECT
      - An object with with a `log` method
      - See `jetta.ProgressLogger` for details and ideas for using a custom progress logger

    - `redirectLimit` INTEGER
      - The max number of redirects for a request

    - `requestOptions` OBJECT
      - Options to use for the request
      - See [http.request](https://nodejs.org/api/http.html#http_http_request_options_callback) for request options, such as `socketPath` (UNIX Domain Sockets), `authentication`, and more.

    - `stream` stream.Readable
      - A readable stream to directly write to the request
      - Recommended for large files
      - Example:
      ```js
      const options = {
        stream: fs.createReadStream('example.mp4'),
        headers: {
          'content-type': 'video/mp4'
        }
      }

      jetta.request('https://example.com/upload', (error, results) => {
        if (error !== null) {
          throw error
        } else {
          // ...
        }
      })
      ```

      - _Infers_:
        - `method`: POST
        - `headers['transfer-encoding']`: 'chunked'

    - `timeLimit` INTEGER
      - A time limit in milliseconds

    - `urlParser` OBJECT
      - The options to be passed to

    - `useDefaultProgressLogger` BOOLEAN
      - Set to `true` to use `jetta.ProgressLogger`

    - _NOTE_:
      - `options` resolution, in the even of option conflicts
        - Headers:
          - `options.cookies` > `options.headers` > _inferred_ (by other options, like `options.json`, `options.form`, etc.)
          - See `results.requestOptionsFinal.headers` in request callback for fast debugging
        - Progress Logger:
          - `options.useDefaultProgressLogger` > `options.progressLog`
        - Request Options:
          - Headers > `options.requestOptions` > parsed `url` results > _inferred_ (by other options, like `options.json`, `options.form`, etc.)
          - See `results.requestOptionsFinal` in request callback for fast debugging
        - Body:
          - `options.stream` > `options.body` > `options.json` > `options.form`
        - urlParser:
          - `options.requestOptions` > `jetta.request`'s defaults as found in `jetta.defaults.request.urlParser`

  - `callback` FUNCTION (error, results)
    - Returns `error` and `results` of the request

      - _NOTE_: `results.error` may carry a bit more information

    - `error` OBJECT
      - if `null`, the request did not have an error
      - else, an `Error` object, using `preferredErrorLanguage` if available

    - `results` OBJECT
      - The results of the response
      - Values other than `error` may not be available if `error !== null`
        - The values that are available may be useful for debugging your request

      - `contentLength` INTEGER
        - The response's content length - as determined from response's content-length header

        - _NOTE_: use `dataLength` to get the actual data length - `contentLength` is used for convenience

      - `data` BUFFER
        - The response data - _the stuff you requested_

      - `dataLength` INTEGER
        - The size of `data` in bytes, as calculated as the data was streamed in

      - `decompressed` OBJECT
        - Determines if the `data` was decompressed
        - If `null` the data was not decompressed
        - Else, an OBJECT with:
          - `from` STRING
            - The format from which the data was decompressed from
          - `using` STRING
            - The tool used to decompress the data

      - `error` OBJECT
        - The error data, if any
        - If `null`, _great_
        - Else, an OBJECT with:
          - `type` STRING
            - A precise error code used in jetta
            - Use as a key for `jetta.error` for additional information
            - Example:
            ```js
            const details = jetta.error[results.error.type].details
            const messageInEnglish = jetta.error[results.error.type].message.en
            ```

          - `details` OBJECT
            - The native `Error` object
            - Due to the nature of requests this may not always be available, thus set to `null`

            - _NOTE_: correlates with `jetta.error[results.error.type].details === false`.

          - `message` STRING
            - The error message, using `preferredErrorLanguage` if available

      - `options` OBJECT
        - The options used for this request _before_ merging parameters
        - Useful for debugging

        - _NOTE_: See `requestOptionsFinal` to see the finalized options used in the request

      - `redirects` INTEGER
        - The number of redirects used in this request

      - `responseHeaders` OBJECT
        - Response Headers from the server
        - Example:
        ```js
        const contentType = results.responseHeaders['content-type']
        const date = results.responseHeaders.date
        const vary = results.responseHeaders.vary
        const xssProtection = results.responseHeaders['x-xss-protection']
        ```

      - `requestOptionsFinal` OBJECT
        - The request options used in the request
        - Example:
        ```js
        const acceptEncoding = results.requestOptionsFinal.headers['accept-encoding']
        const protocol = results.requestOptionsFinal.protocol
        const userAgent = results.requestOptionsFinal.headers['user-agent']
        ```

      - `statusCode` INTEGER
        - The final status code of the request
        - Example:
        ```js
        const statusCode = results.statusCode
        // > 200, 206, 404, etc.
        ```

      - `time` OBJECT
        - `response` INTEGER
          - the time it took to download and process the response, in milliseconds
        - `total` INTEGER
          - the total request time, in milliseconds

      - `url` OBJECT
        - The parsed URL results from `jetta.urlParser`
        - `null` if `options.url === null`

  - `currentRedirects` INTEGER _optional_
    - Preset the redirect count for a request