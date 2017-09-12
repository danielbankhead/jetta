## Future
  - [HTTP/2 support](https://nodejs.org/api/http2.html)

  - Investigate Windows + HTTPS + Request Stream issue (seems to only happen in tests)
    - See [`expectHTTPSStreamErrorOnWindows` in test](https://github.com/AltusAero/jetta/blob/55a202594a148bb815e19d715723bbfb50dd1dfa/test/request/http-protocols/index.js#L16) and where it is used.
    - See error in AppVeyor [build #24 - L364](https://ci.appveyor.com/project/DanielBankhead/jetta/build/24-staging/job/v1hmrj792f0sovu5#L364)

  - Add logo

  - Useful `examples/`
    - With videos and gifs
    - Progress logging examples:
      - By percent
      - By bytes
      - Time - estimated & total

  - Use `makeNestedDirectory` for request's `toFile` option
    - Update `test/request/shared-options`
    - Consider file URLs, which contain encoded paths

  - Introductory video or gif, with real-world examples, on main README.md

  - Error messages in more languages
    - Use [ISO 639-1 codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
    - See:
      - `jetta.JettaError`
      - [lib/jetta-error.js](lib/jetta-error.js)

  - Use `process.env.LANG` as the fallback `preferredErrorLanguage`
    - Perhaps:
      ```js
      const preferredErrorLanguage = process.env.LANG.split('.')[0].split('_')[0]
      ```
      - Consider Chinese, where language locale matters

  - Proxy support
    - Consider this from Electron: https://github.com/electron/electron/pull/7577

  - `options.range` OBJECT - an easy, convenient option for RANGE requests, in bytes
    - Can manually set range header in `options.headers` if interested in advanced features, such as multi-range (i.e. `range: bytes=0-512,1024-`)

    - `from` INTEGER
      - Start byte, inclusive (zero-based, i.e. 0 = 1st byte)
      - _default_ = `0`
    - `to` INTEGER
      - Start byte, inclusive (zero-based, i.e. if file size is 1024, `1023` would be the last byte)
      - Can be `null` for get all bytes from `from`
      - _default_ = `null`
    - `strict` BOOLEAN
      - If `data > range` (`content-length` or actual) or if status is not `206`, then cancel w/ error
      - _default_: `true`

    - See for examples and ideas:
      - http://stackoverflow.com/questions/8696523/nodejs-http-range-support-partial-file-download
      - http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html
      - https://gist.github.com/padenot/1324734
