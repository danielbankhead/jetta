### jetta.cookieLib `OBJECT`
  - A utility for parsing, stringifying, and validating cookies.
  - Example:
  ```js
  const cookie = jetta.cookieLib.parseSetCookie('id=example; Domain=example.com; Secure; SameSite')
  ```

  - Options for `jetta.cookieLib.parse*` and `jetta.cookieLib.stringify*` can be found at [cookie-options.md](cookie-options.md)
  - All options are optional (defaults can be found in `jetta.defaults.cookie`)
  - All methods may throw an instance of `JettaError` if something is invalid.

  - `ParsedCookieHeader` CLASS - represents a parsed Cookie header
    - Handy for using with `instanceof` and *instance*`.constructor` throughout your codebase

    - _instance_
      - `name` (alias `Name`) STRING
      - `value` (alias `Value`) STRING

      - Aliases are getters and setters
  - `ParsedSetCookieHeader` CLASS
    - Represents a parsed Set-Cookie header
    - Handy for using with `instanceof` and *instance*`.constructor` throughout your codebase

    - _instance_
      - `name` (alias `Name`) STRING
      - `value` (alias `Value`) STRING
      - `Expires` (alias `expires`) DATE | `null`
      - `Max-Age` (alias `max-age`, `maxAge`) NUMBER | `null`
        - In seconds, not milliseconds
      - `Domain` (alias `domain`) STRING | `null`
      - `Path` (alias `path`) STRING | `null`
      - `Secure` (alias `secure`) BOOLEAN | `null`
      - `HttpOnly` (alias '`http-only`', '`Http-Only`', `httpOnly`, `httponly`) BOOLEAN | `null`
      - `SameSite` (alias `sameSite`, `samesite`) STRING<'None','Strict','Lax'> | `null`

      - Aliases are getters and setters
      - Any other cookie attributes/information will be passed as-is
        - `true` if no value, string otherwise

  - `parseCookie` FUNCTION (`cookieString` STRING[, `options` OBJECT]) - parses the value from a Cookie header into an array of objects
    - Each object is an instance of `jetta.cookieLib.ParsedCookieHeader` with name and value
    - Example:
      ```js
      jetta.cookieLib.parseCookie('user=bob; color=blue')
      // returns:
      // [ ParsedCookieHeader { name: 'user', value: 'bob' },
      // ParsedCookieHeader { name: 'color', value: 'blue' } ]
      ```

    - _return_ ARRAY<_instanceof_ `jetta.cookieLib.ParsedCookieHeader`>
  - `parseCookieKV` FUNCTION (`cookieString` STRING[, `options` OBJECT]) - parses the value from a Cookie header into a key-value object, where key is the cookie's name
    - Example:
      ```js
      jetta.cookieLib.parseCookieKV('user=bob; color=blue')
      // -> { user: 'bob', color: 'blue' }
      ```

    - _return_ OBJECT
  - `parseSetCookie` FUNCTION (`cookieString` STRING[, `options` OBJECT]) - parses the value from a Set-Cookie header - into an object with various cookie attributes
    - Example:
      ```js
      jetta.cookieLib.parseSetCookie('id=1502909778285-2-4892-bob-1a; expires=Thu, 01 Jul 2021 04:00:00 GMT; path=/; domain=.example.com; HttpOnly; Secure')
      // returns:
      // ParsedSetCookieHeader {
      // name: 'id',
      // value: '1502909778285-2-4892-bob-1a',
      // Expires: 2021-07-01T04:00:00.000Z,
      // 'Max-Age': null,
      // Domain: 'example.com',
      // Path: '/',
      // Secure: true,
      // HttpOnly: true,
      // SameSite: null }
      ```

    - _return_ _instanceof_ `jetta.cookieLib.ParsedSetCookieHeader`
  - `stringifyCookie` FUNCTION (`cookieList` ARRAY<OBJECT>[, `options` OBJECT]) - stringifies an array of objects - into a value for a cookie header
    - The objects in the array passed to the function may be:
      - _instanceof_ `jetta.cookieLib.ParsedCookieHeader`
      - _instanceof_ `jetta.cookieLib.ParsedSetCookieHeader`
      - Any `OBJECT` with name and value attributes
    - Removes any unnecessary wrapping double-quotes around the value
    - Example:
      ```js
      jetta.cookieLib.stringifyCookie([{name: 'cat', value: 'Internet'}, {name: 'js', value: '"JavaScript"'}])
      // -> 'cat=Internet; js=JavaScript'
      ```

     - _return_ STRING
  - `stringifyCookieKV` FUNCTION (`cookieKeyValues` OBJECT[, `options` OBJECT]) - stringifies an object of key-value attributes into a value for a cookie header (where key = cookie's name)
    - Removes any unnecessary wrapping double-quotes around the value
    - Example:
      ```js
      jetta.cookieLib.stringifyCookieKV({cat: 'Internet', js: '"JavaScript"'})
      // -> 'cat=Internet; js=JavaScript'
      ```

    - _return_ STRING
  - `stringifySetCookie` FUNCTION (`cookie` OBJECT[, `options` OBJECT]) - stringifies a cookie-like object into a string to be used with a Set-Cookie header
    - Removes any unnecessary wrapping double-quotes around the value
    - Can pass an _instanceof_ `jetta.cookieLib.ParsedSetCookieHeader` or Object
    - If passing an Object:
      - keys can match the aliases from `jetta.cookieLib.ParsedSetCookieHeader`
      - Expires can be a `Date`, `Number` (milliseconds since UNIX epoch, e.g. `Date.now()`), or `Date` string
      - Max-Age is a `Number` in seconds
      - SameSite can be a string or boolean
    - Example:
      ```js
      jetta.cookieLib.stringifySetCookie({name: 'example', value: 'cookie', Expires: new Date(1498591378533)})
      // -> 'example=cookie; Expires=Tue, 27 Jun 2017 19:22:58 GMT'
      ```

    - _return_ STRING
  - `safeHTTPMethods` OBJECT - an an object of HTTP methods that are considered to be 'safe'
    - Example:
      ```js
      jetta.cookieLib.safeHTTPMethods.GET === true
      jetta.cookieLib.safeHTTPMethods.POST === undefined
      jetta.cookieLib.safeHTTPMethods.UNKNOWN_METHOD === undefined
      ```
  - `validCookieNameRegex` REGEXP - a regular expression generated from RFC 6265 Section 4.1.1 for valid cookie names
    - Example:
      ```js
      jetta.cookieLib.validCookieNameRegex.test('example') === true
      jetta.cookieLib.validCookieNameRegex.test('') === false
      jetta.cookieLib.validCookieNameRegex.test('ø') === false
      ```
  - `validCookieValueRegex` REGEXP - a regular expression generated from RFC 6265 Section 4.1.1 for valid cookie values
    - Example:
      ```js
      jetta.cookieLib.validCookieValueRegex.test('example') === true
      jetta.cookieLib.validCookieValueRegex.test('') === true
      jetta.cookieLib.validCookieValueRegex.test('a b') === false
      jetta.cookieLib.validCookieValueRegex.test('π') === false
      ```
  - `validPathValueRegex` REGEXP - a regular expression generated from RFC 6265 Section 4.1.1 for valid cookie paths
    - Example:
      ```js
      jetta.cookieLib.validPathValueRegex.test('example') === true
      jetta.cookieLib.validPathValueRegex.test('some/path/example') === true
      jetta.cookieLib.validPathValueRegex.test('') === true
      jetta.cookieLib.validPathValueRegex.test('a b') === true
      jetta.cookieLib.validPathValueRegex.test(';') === false
      jetta.cookieLib.validPathValueRegex.test('π') === false
      ```
  - `trailingSemicolonRegex` REGEXP - a regular expression for trailing semicolons

  For 100% cross-platform compatibility there is no built-in encoder/decoder for cookie names & values (most US-ASCII characters are accepted). You can easily use `decodeURIComponent` and `encodeURIComponent` where necessary and can test via `jetta.cookieLib.validCookieNameRegex`, `jetta.cookieLib.validCookieValueRegex`, and `jetta.cookieLib.validPathValueRegex` (the `jetta.cookieLib.parse*` and `jetta.cookieLib.stringify*` functions use these internally).
