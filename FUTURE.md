## Future
  - examples/
    - add a few examples
      - with videos and gifs
      - progress logging
        - by percent
        - by bytes
        - time example (estimated & total)

  - use `makeNestedDirectory` for request's `toFile` feature
    - update `test/request/shared-options`
      - consider file URLs, which contain encoded paths

  - introductory video or gif, with real-world examples
    - on main README.md
    - dedicated examples for each main feature in their dedicated sections

  - Error messages in more languages
    - use [ISO 639-1 codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
    - See:
      - [lib/jetta-error.js](lib/jetta-error.js)

  - HTTP/2 support
    - [nodejs/http2](https://github.com/nodejs/http2)

  - Proxy support
    - Consider this from Electron: https://github.com/electron/electron/pull/7577

  - Range option - an easy, convenient option for RANGE requests, in bytes
    - `options.range` OBJECT
      - Can manually set range header in `options.headers` if interested in advanced features, such as multi-range (i.e. `range: bytes=0-512,1024-`)

      - `from` INTEGER
        - Start byte, inclusive (zero-based, i.e. 0 = 1st byte)
        - _default_ = `0`
      - `to` INTEGER
        - Start byte, inclusive (zero-based, i.e. if file = 1024, `1023` would be the last byte)
        - can be `null` for get all bytes from `from`
        - _default_ = `null`
      - `strict` BOOLEAN
        - if `data > range` (`content-length` or actual) or if status is not `206`, then cancel w/ error
        - _default_: `true`
    - See for examples and ideas:
      - http://stackoverflow.com/questions/8696523/nodejs-http-range-support-partial-file-download
      - http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html
      - https://gist.github.com/padenot/1324734
