### Cookie Options

For your convenience we've unified the options for `jetta.cookieLib` and methods for `jetta.cookieManager` instances.

Some options are not applicable in all situations, but does not hurt if used.
Defaults can be found in `jetta.defaults.cookie`.

- `allowExpiredSetCookie` BOOLEAN - if `true`, functions that parse and add cookies from Set-Cookie headers will not throw if `Expires` or `Max-Age` signifies that something has expired
- `fromHttpApi` BOOLEAN - should be `false` if from "non-HTTP API" according to [RFC 6265](https://tools.ietf.org/html/rfc6265#section-8.5).
  - Here are some examples from RFC 6265 as to what this means:
    - A web browser API that exposes cookies to scripts
    - HTML's `document.cookie` API
- `isSecureEnv` BOOLEAN - if the request is made in a secure environment, such as HTTPS
- `isTopLevelBrowsingContext` BOOLEAN - means 'the address bar's URL would changes for this request'.
  - `false` for iframes, images, XMLHttpRequests, and the like.
  - See [Determining `isTopLevelBrowsingContext`, `requestURL`, and `topLevelURL`](#determining-istoplevelbrowsingcontext-requesturl-and-toplevelurl) section and [section 7.1 - Browsing contexts](https://html.spec.whatwg.org/multipage/browsers.html#top-level-browsing-context) in the HTML spec
- `preferredErrorLanguage` STRING - as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
  - See `jetta.JettaError` for details
- `publicSuffix` _instanceof_ `jetta.PublicSuffix` | `null` - a `jetta.PublicSuffix` instance used to check if a cookie's domain is a public suffix
  - If `null` or not given, public suffixes will not be checked (always provided when called via `jetta.CookieManager` instance)
- `requestMethod` STRING - the request's HTTP method (i.e. 'GET', 'POST', etc.)
- `requestURL` STRING - the URL where cookies are sent or received
  - This is not always the `topLevelURL`. See [Determining `isTopLevelBrowsingContext`, `requestURL`, and `topLevelURL`](#determining-istoplevelbrowsingcontext-requesturl-and-toplevelurl)
- `thirdPartyCookiesAllowed` BOOLEAN - when `topLevelURL` option is used, allow third-party cookies
  - A third-party cookie is when the cookie's domain does not match the hostname of the `topLevelURL`
- `topLevelURL` STRING - the `topLevelURL` of the context
  - See [Determining `isTopLevelBrowsingContext`, `requestURL`, and `topLevelURL`](#determining-istoplevelbrowsingcontext-requesturl-and-toplevelurl)


#### Determining `isTopLevelBrowsingContext`, `requestURL`, and `topLevelURL`

Say you are visiting example.com and example.com has an iframe for some-other-example.com. In this case: `requestURL` is 'some-other-example.com', `topLevelURL` is 'example.com', and `isTopLevelBrowsingContext` is `false`.

Notice that `isTopLevelBrowsingContext` is not inferred (for security reasons) via checking if `requestURL` is in `topLevelURL` on the domain level. Here is an example for how this is not always true:
- You request 'example.com'
- 'example.com' has an iframe 'some-other-example.com'
- 'some-other-example.com' pulls images from 'example.com'
