TEST: the default max download length should be fine for the public suffix download

Read more about the pros/cons of the `Referer` header from the [RFC 7231 Section 5.5.2](https://tools.ietf.org/html/rfc7231#section-5.5.2). Here are a few:
  - pros:
    - helps prevent CSRF attacks
    - required for some sites to verify logins
  - cons:
    - reveals request browsing history (privacy)/tracking
    - some sites may deny links from other sites

Decompress others, like Brotli, via `options.onResponseData` https://en.wikipedia.org/wiki/Brotli
  - If unknown Content-Encoding and request completed without an error, then check results.contentEncoding
  - TODO: whitelist option?

results.options.requestBodyStream infers redirectLimit = 0

results.options.onResponseData = `(data, results) => {}`
  - decompressed data
  - can check the current state of the results with `results` so that you can make decisions on the recieved data
    - such as if the data was decompressed and what with
    - if there were any redirects `results.redirects` (may want to empty the existing results)
  - streams, therefore may be called multiple times
  - while asynchronous, this will be guaranteed to be called before the main callback (so you won't have to worry about missing data at the end), if there is any data to be received/processed
  - on end or error, the main callback will be used

results.time: only calculates for the most recent request (does not include redirects)

All options have a counterpart in defaults.json

engine
  `{protocol: function}`
  Want to use a custom engine, like the Electron's [net](https://electron.atom.io/docs/api/net/) module?

  Should be compatible with Node.js's http.request structure

TEST: Input Objects are not mutuated

Space = cookie manager + redirectUpdateReferer option
  - isolated per space

.
