### jetta.CookieManager `CLASS` extends `EventEmitter`
  - Add, delete, and update cookies
  - Easy import and export
  - Generate Cookie and Set-Cookie headers with context (domain, subdomains, path, security, HttpOnly, etc.)
  - Automatically deletes expired cookies
  - Built-in `jetta.PublicSuffix` to make sure you're not saving & sending [supercookies](https://en.wikipedia.org/wiki/HTTP_cookie#Supercookie)
  - Example:
  ```js
  const cm = new jetta.CookieManager()
  ```

  - new jetta.CookieManager([`options` OBJECT])
    - All options are optional (defaults can be found in `jetta.defaults.cookieManager`)

    - `options` OBJECT _optional_
      - `cookies` OBJECT
        - Cookies from a previous export via _instance_.`export()`
      - `maxCookieByteLength` INTEGER
        - Max size for an individual cookie when added
      - `maxCookies` INTEGER
        - Max number of cookies
        - If exceeded purges all cookies, except for the most recently added cookie
      - `maxCookiesPerDomain` INTEGER
        - Max number of cookies for a particular domain
        - If exceeded purges all cookies for a domain, except for the most recently added cookie
      - `publicSuffix` OBJECT
        - A `jetta.PublicSuffix` instance
        - This is useful for sharing a single `jetta.PublicSuffix` instance across multiple cookie instances
        - If not passed, one will be created with `publicSuffixOptions`
        - If this is passed, but not an instance of `jetta.PublicSuffix`, this will be treated as `publicSuffixOptions`
          - `publicSuffixOptions` has preference in options resolution
      - `publicSuffixOptions` OBJECT
        - The options to use when creating the internal `jetta.PublicSuffix` instance when `publicSuffix` has not been passed
      - `preferredErrorLanguage` OBJECT
        - The preferred language as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for any errors that may be raised
        - Used as the default for all methods

    - _instance_ OBJECT
      - Should wait for 'ready' event
        - You do not have to wait, nor listen, to the 'ready' event if only being used with `jetta.request*` as the request(s) will wait on it for you
      - Should call `destroy` when finished or when you plan on exiting the process
      - Options for all methods can be found at [cookie-options.md](cookie-options.md)
      - All options are optional (defaults can be found in `jetta.defaults.cookie`)

      - Events
        - 'ready'
          - Emitted when ready to use - particularly due to the underlying `jetta.PublicSuffix` instance being ready
        - 'error' (_instanceof_ `jetta.JettaError`)
        - 'addedCookie' (_instanceof_ `jetta.CookieManagerCookie`)
          - When a cookie has been successfully added via `addCookie`
        - 'deletedCookie' (_instanceof_ `jetta.CookieManagerCookie`)
          - When a cookie has been successfully deleted via `deleteCookie`
        - 'updatedCookie' (_instanceof_ `jetta.CookieManagerCookie`)
          - When a cookie has been successfully updated via `addCookie`
        - 'updatedPublicSuffix'
          - When public suffix has been updated

      - `addCookie` (`setCookie` STRING | OBJECT | _instanceof_ `jetta.cookieLib.ParsedSetCookie`[, `options` OBJECT])
        - Add a cookie, overwrite if exists
        - `setCookie` should be a valid Set-Cookie value

        - _return_ _instanceof_ `jetta.CookieManagerCookie`
      - `deleteCookie` (`cookie` OBJECT | _instanceof_ `jetta.CookieManagerCookie`)
        - Deletes a cookie, if it exists
        - `cookie` option should have the following:
          - `name` STRING
          - `domain` STRING
          - `path` STRING
        - Returns `true` if it existed prior to deletion (does not throw if not found)

        - _return_ BOOLEAN
      - `deleteExpiredCookies` ()
        - Deletes expired cookies
        - Called internally in most methods
      - `deleteSessionCookies` ()
        - Deletes all session cookies
      - `generateCookieHeader` (`url` STRING | OBJECT[, `options` OBJECT])
        - Generates a Cookie header, usable for requests
        - `url` should be compatible with `jetta.urlParser`
      - `getCookie` (`cookie` OBJECT | _instanceof_ `jetta.CookieManagerCookie`)
        - Returns a previously added cookie, if it exists
        - `cookie` option should have the following:
          - `name` STRING
          - `domain` STRING
          - `path` STRING

        - _return_ _instanceof_ `jetta.CookieManagerCookie` | `null`
      - `getCookies` (`filter` OBJECT | _instanceof_ `jetta.CookieManagerCookie`)
        - Returns a list of previously added cookies
        - `filter` option should have the following:
          - `name` STRING | `null`
          - `domain` STRING | `null`
          - `path` STRING | `null`

          - Strings are exact-match
          - `null` and empty strings are treated as wildcards

        - _return_ ARRAY<_instanceof_ `jetta.CookieManagerCookie`>
      - `destroy` ([`destroyPublicSuffix` BOOLEAN])
        - Effectively destroys the `jetta.cookieManager` instance

        - `destroyPublicSuffix` BOOLEAN _optional_
          - Preserve underlying `jetta.PublicSuffix` instance (_instance_.`publicSuffix`) by setting `destroyPublicSuffix` to `false`
            - Should **not** destroy public suffix when:
              - Sharing across multiple `jetta.cookieManager` instances
              - When you plan on reusing the `jetta.publicSuffix` instance in the same process (saves time)
          - _default_ `true`
      - `export` ()
        - Exports all cookies and options in a JSON-stringifyable object
        - Perfect solution for durable cookie storage and transfer
        - Does not export _instance_.`publicSuffix` (should use instance instead)
          - However, saves _instance_.`publicSuffixOptions`
        - Exports session cookies
          - If you do not want to save session cookies use `deleteSessionCookies()` before export
        - Exported object can be passed directly into a new `jetta.CookieManager` instance

        - _return_ OBJECT

### jetta.CookieManagerCookie `CLASS`
  - A simple object representing a cookie prepared for storage
  - Created internally by `jetta.CookieManager` instances where cookies are returned
  - Handy for using with `instanceof` and *instance*`.constructor` throughout your codebase
  - Example:
  ```js
  const cookieForStorage = new jetta.CookieManagerCookie()
  ```

  - new jetta.CookieManagerCookie([`attributes` OBJECT])
    - `attributes` STRING
      - The cookie's attributes

    - _instance_ OBJECT
      - `name` STRING
      - `value` STRING
      - `domain` STRING
      - `path` STRING
      - `expiry-time` INTEGER | `null`
        - timestamp in milliseconds since UNIX epoch
      - `creation-time` INTEGER
        - timestamp in milliseconds since UNIX epoch
      - `last-access-time` INTEGER
        - timestamp in milliseconds since UNIX epoch
      - `persistent-flag` BOOLEAN
        - is session cookie if this is `false`
      - `host-only-flag` BOOLEAN
        - Denotes if cookie should use *exact* same host only (no subdomains)
      - `secure-only-flag` BOOLEAN
        - Denotes cookie should only be sent over secure channels
      - `http-only-flag` BOOLEAN
        - Denotes if cookie should only be used via HTTP-APIs
          - Example: no JS access in the browser when this is set
      - `samesite-flag` STRING<'None','Strict','Lax'>

      - These attributes and values are guaranteed available when created via `jetta.CookieManager` instance
