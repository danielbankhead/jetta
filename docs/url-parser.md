### `jetta.urlParser` (candidate[, options])
  - Parse and validate URLs
  - Example:
  ```js
  const urlResults = jetta.urlParser('example.com/about/', {addMissingProtocol: true})

  urlResults.isLocalhost
  // > false
  urlResults.isValid
  // > true
  urlResults.parsedURL.protocol
  // > 'https:'
  ```

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
      jetta.urlParser('http://127.0.0.1', {localhostAllowed: true}).isValid
      // > true
      jetta.urlParser('http://localhost', {localhostAllowed: false}).isValid
      // > false
      jetta.urlParser('::1', {localhostAllowed: true}).isValid
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
