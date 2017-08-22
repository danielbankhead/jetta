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

  - jetta.urlParser(`candidate` STRING | OBJECT[, `options` OBJECT])
    - Effectively never throws, even on ill-formatted/invalid URLs as it internally catches any errors and returns `results.isValid` = `false`

    - `candidate` STRING | OBJECT
      - The URL to parse and validate
      - If Object, `hostname` attribute is required (an instance of `url.Url` would be handy here)

    - `options` OBJECT _optional_
      - Defaults can be found in `jetta.defaults.urlParser`

      - `addMissingProtocol` BOOLEAN
        - Determines if missing protocols should be added for parsing
        - Example:
          ```js
          jetta.urlParser('example.com', {addMissingProtocol: true}).url
          // returns: 'https://example.com'
          ```

      - `allowWhitespaceBeforeFormatting` BOOLEAN
        - Determines if `candidate` is a string, should the parser format it
        - Set this to `false` for stricter validation
        - Example:
          ```js
          jetta.urlParser('https://example.com/here there', {allowWhitespaceBeforeFormatting: false}).isValid
          // returns: false
          ```

      - `ipAddressesAllowed` BOOLEAN
        - Determines if IP Addresses are allowed (both IPv4 & IPv6) for the hostname

      - `localhostAllowed` BOOLEAN
        - Determines if 'localhost' is allowed, including localhost IP Addresses (`127.*.*.*` & `::1`)
        - Useful for security purposes
        - Setting this to `true` and `ipAddressesAllowed` to `false` means 'https://127.0.0.1' and 'https://[::1]' are invalid while 'localhost' is fine

      - `protocolsAllowed` OBJECT
        - A key-value object of protocols allowed, where value is `true`
        - Set to `null` to allow all protocols
        - Example:
          ```js
          const protocolsAllowed = {
            'https:': true,
          }
          jetta.urlParser('https://example.com/', {protocolsAllowed}).isValid // true
          jetta.urlParser('http://example.com/', {protocolsAllowed}).isValid // false
          ```

      - `protocolReplacement` STRING
        - The protocol to be added when the parsed URL's protocol is missing and `addMissingProtocol === true`
        - It should be with colons, but without slashes (to match the `url.protocol`'s format).
          - i.e. 'https:' not 'https' or 'https://'

      - `localhostAllowed` BOOLEAN
        - Determines if localhost URLs are considered valid
        - Example:
          ```js
          jetta.urlParser('http://127.0.0.1', {localhostAllowed: true}).isValid // true
          jetta.urlParser('http://localhost', {localhostAllowed: false}).isValid // false
          jetta.urlParser('::1', {localhostAllowed: true}).isValid // true
          ```

    - _return_ `results` OBJECT
      - `isLocalhost` BOOLEAN
      - `isValid` BOOLEAN
      - `options` OBJECT
        - The options used to parse, process, and validate `candidate`
        - This is never `null`

        - `addMissingProtocol` BOOLEAN
        - `allowWhitespaceBeforeFormatting` BOOLEAN
        - `ipAddressesAllowed` BOOLEAN
        - `localhostAllowed` BOOLEAN
        - `protocolsAllowed` OBJECT
        - `protocolReplacement` STRING
      - `parsedURL` OBJECT _instanceof_ `url.Url` | `null`
        - The parsed URL, an instance of node's [url.Url](https://nodejs.org/api/url.html)
          - If `candidate` was in
      - `url` STRING
        - The formatted URL
