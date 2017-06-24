## Future
  - examples/
    - add a few examples

  - parse JSON results
    - `results.json`

  - introductory video, with real-world examples
    - on README.md

  - Error messages in more languages
    - See:
      - [data/error.json](data/error.json)
      - ISO 639-1 codes
        - https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

  - Proxy support
    - Consider this from Electron: https://github.com/electron/electron/pull/7577

  - Range option - an easy, convenient option for RANGE requests in bytes
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
