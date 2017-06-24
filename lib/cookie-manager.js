#! /usr/local/bin/node
'use strict'

const events = require('events')

const defaults = require('../data/defaults')
const JettaError = require('./error')
const packageInfo = require('../package')
const PublicSuffix = require('./public-suffix')
const urlParser = require('./url-parser')

class CookieManager extends events {
  /*
  6 Static Methods:
    .parseCookie (cookieString STRING[, options OBJECT]) -> ARRAY<OBJECT>
      - Parses the value from a Cookie header into an array of objects - each with (at least) a name and value
      -> [{name: foo, value: bar}, {name: X, value: Y}, ...]
    .parseCookieKV (cookieString STRING[, options OBJECT]) -> OBJECT
      - Parses the value from a Cookie header into a key:value object (where key = cookie's name)
      -> {name: value, name: value, ...}
    .parseSetCookie (cookieString STRING[, options OBJECT]) -> OBJECT
      - Parses the value from a Set-Cookie header - into an object with various cookie attributes
      -> {name: foo, value: bar, expires, maxAge, domain, path, ...}

      name (alias Name): STRING
      value (alias Value): STRING
      Expires (alias expires): DATE
      Max-Age (alias 'max-age', maxAge): NUMBER
        - in seconds, not milliseconds
      Domain (alias domain): STRING
      Path (alias path): STRING
      Secure (alias secure): BOOLEAN
      HttpOnly (alias 'http-only', 'Http-Only', httpOnly, httponly): BOOLEAN
      SameSite (alias sameSite, samesite): STRING<'Strict','Lax'>
      ...any other cookie attributes/information will be passed as-is
        - BOOLEAN if no value, STRING otherwise

    .stringifyCookie (cookieList ARRAY<OBJECT>[, options OBJECT]) -> STRING
      - Stringifies an array of object - each with (at least) name and value attributes - into a value for a cookie header
      -> foo=bar; X=Y; ...
    .stringifyCookieKV (cookieKeyValues OBJECT[, options OBJECT]) -> STRING
      - Stringifies an object of key-value attributes into a value for a cookie header (where key = cookie's name)
      -> foo=bar; X=Y; ...
    .stringifySetCookie (cookie OBJECT[, options OBJECT]) -> STRING
      - Stringifies a cookie-like object into a string to be used with a Set-Cookie header
      - See `.parseSetCookie` for list of possible attributes and usable aliases for values
      -> foo=bar; Path=/; Secure; ...

    All methods may throw an instance of `JettaError` (instance of `Error`) if something is invalid

    options
      - allowExpiredSetCookie BOOL
        - If allowed, Set Cookie will not throw if Expires or Max Age signifies that something has expired
      - fromHttpApi BOOL
        - Should be false if from "non-HTTP API" according to RFC 6265.
        - Here are some examples from RFC 6265 as to what this means:
          - a web browser API that exposes cookies to scripts
          - HTML's `document.cookie` API
      - isSecureEnv BOOL
        - the request is made in a secure environment, such as HTTPS
      - isTopLevelBrowsingContext BOOL
        - `Top-level means that the URL in the address bar changes because of this navigation. This is not the case for iframes, images or XMLHttpRequests.`
      - preferredErrorLanguage STRING
      - publicSuffix OBJECT
        - a PublicSuffix instance (or compatible object) used for checking against if public suffix
        - if NULL or not given, public suffixes will not be checked (and ignored)
      - requestMethod STRING
        - the request's HTTP method
      - requestURL STRING
        - the URL in which the request is for (as in the site to sending or to recieve the cookies)
      - thirdPartyCookiesAllowed BOOL
        - When topLevelURL !== null, this allows third-party cookies when cookie's domain does not match the hostname of the topLevelURL
      - topLevelURL STRING
        - the topLevelURL of the request
          - TODO: for example, iframe, etc.
        - can be domain or full URL
        - this will be used as "site for cookies" internally
          - consider nested iframes and sandboxing rules - [Same-Site Cookies (Draft) Section 2.1](https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-2.1) (and subsections) of the draft may help you determine what this should be

    TEST: each should be cross-compatible

  For 100% cross-platform compatibility there is no built-in encoder/decoder for cookie names & values (most US-ASCII characters are accepted). You can easily use `decodeURIComponent` and `encodeURIComponent` where necessary and can test via `CookieManager.validCookieNameRegex`, `CookieManager.validCookieValueRegex`, and `CookieManager.validPathValueRegex` (the parse* and stringify* functions uses these static methods).

  INSTANCE
    - add, delete, and update cookies
    - generate cookie header strings with context (domain, subdomains, path, security, HttpOnly, etc.)
    - built-in public suffix manager - no worries on 'super cookies' being sent any parent domains
    - easy import and export, including public suffix database
    - automatically deletes expired cookies
    - is an event emitter (primarily because the underlying publicSuffix instance is also an event emitter)
      - ready
      - error JettaError
      - addedCookie
        - when a cookie has been successfully added via `addCookie`
      - deletedCookie
        - when a cookie has been successfully added via `addCookie`
      - updatedPublicSuffix
        - when public suffix has been updated

      - NOTE: does not have to wait, nor listen, to 'ready' event if only being used for requests (the request(s) will wait on it for you)

      domain STRING
      path STRING
      name STRING
      value STRING
      'expiry-time' NULL || timestamp in milliseconds
      'creation-time' timestamp in milliseconds
      'last-access-time' timestamp in milliseconds
      'persistent-flag' BOOL (is session cookie if false)
      'host-only-flag' BOOL ((exact) same host only)
      'secure-only-flag': BOOL (can only be sent over secure channels)
      'http-only-flag': false,
      'samesite-flag': 'None'

  NOTE: jetta.request
    NOTE: cookieManager:
      NOTE: handles updates through requests and redirects
    NOTE: provide "disposable" cookie manager example, for request where you do not want
      TODO: cookieManager.clone?
    NOTE: jetta.request -> between request you can easily delete session cookies via `deleteSessionCookies()`

  TEST: preferred error language inheritance
  TEST: 'NID=106=QrDmti6XXOba3Fctytq9XoWMLmcU6h6wyzd8ZprTa_G3wmVZn9XXuXaj-DXfXiGkGXIl18_KP099Gl5bjx3BUK0s_TpphUJd9sDcfw0-5IcuprsgtH1ZPzRbQHc7hWN17UgBPuiJhQNDpWeOSw; expires=Fri, 22-Dec-2017 21:57:36 GMT; path=/; domain=.google.com; HttpOnly' is a valid cookie
  */

  constructor (options = {}) {
    super()

    Object.assign(this, defaults.cookieManagerInstance, options)

    this.publicSuffix = new PublicSuffix(Object.assign({}, {preferredErrorLanguage: this.preferredErrorLanguage}, this.publicSuffix, this.publicSuffixOptions))

    this.publicSuffix.once('ready', () => this.setReady())
    this.publicSuffix.on('error', (e) => this.handlePublicSuffixError(e))
    this.publicSuffix.on('updatedPublicSuffix', () => this.handleUpdatedPublicSuffix())
  }

  handlePublicSuffixError (error) {
    this.emit('error', new JettaError('jetta-cookie-public-suffix-error', this.preferredErrorLanguage, error))
  }

  handleUpdatedPublicSuffix () {
    this.emit('updatedPublicSuffix')
  }

  export () {
    // TEST: should be JSON-stringifyable
    // TEST: export does not need to wait when ready (both empty publicSuffix.list, publicSuffix.lastUpdated should be loaded upon init)
    // TEST: should contain jettaVersion === packageInfo
    // NOTE: if you do not want to save session cookies use this.deleteSessionCookies() before export
    // TEST: saves publicSuffixOptions, not the suffix itself
    this.deleteExpiredCookies()

    return Object.assign({}, this, {publicSuffix: null}, {jettaVersion: packageInfo.version})
  }

  addCookie (givenInfo = null, givenOptions = {}) {
    // TEST: can throw if not ready

    this.deleteExpiredCookies()

    const now = Date.now()
    const options = Object.assign({}, defaults.cookieManager, {publicSuffix: this.publicSuffix}, givenOptions)

    if (typeof givenInfo !== 'string') {
      givenInfo = CookieManager.stringifySetCookie(givenInfo, options)
    }

    const info = CookieManager.parseSetCookie(givenInfo, options)

    let newCookie = {
      value: info.value,
      'expiry-time': null,
      'creation-time': now,
      'last-access-time': now,
      'persistent-flag': false,
      'host-only-flag': false,
      'secure-only-flag': false,
      'http-only-flag': false,
      'samesite-flag': 'None'
    }

    let existingCookie = null
    let isDeleteCookie = false
    let topLevelNavHostname = null
    let parsedRequestURL = null

    let cName = info.name
    let cDomain = info.domain
    let cPath = info.path

    if (typeof options.topLevelURL === 'string') {
      const topLevelURLCandidate = urlParser(options.topLevelURL.replace(/^\.+/, ''), {addMissingProtocol: true, localhostAllowed: true})

      if (topLevelURLCandidate.isValid === true) {
        topLevelNavHostname = topLevelURLCandidate.parsedURL.hostname
      }
    }

    if (options.requestURL !== null) {
      const requestURLCandidate = urlParser(options.requestURL.replace(/^\.+/, ''), {addMissingProtocol: true, localhostAllowed: true})

      if (requestURLCandidate.isValid === true) {
        parsedRequestURL = requestURLCandidate.parsedURL
      }
    }

    if (typeof info.maxAge === 'number') {
      newCookie['persistent-flag'] = true

      if (info.maxAge > 1) {
        newCookie['expiry-time'] = now + (info.maxAge * 1000)
      } else {
        isDeleteCookie = true
      }
    } else if (info.expires instanceof Date) {
      newCookie['persistent-flag'] = true

      if (info.expires.valueOf() > now) {
        newCookie['expiry-time'] = info.expires.valueOf()
      } else {
        isDeleteCookie = true
      }
    }

    if (typeof info.domain !== 'string') {
      newCookie['host-only-flag'] = true

      if (parsedRequestURL !== null) {
        cDomain = parsedRequestURL.hostname
      } else {
        throw new JettaError('jetta-cookie-no-valid-domain-for-use', options.preferredErrorLanguage)
      }
    }

    if (info.secure === true) {
      newCookie['secure-only-flag'] = true
    }

    if (info.httpOnly === true) {
      newCookie['http-only-flag'] = true
    }

    if (typeof info.sameSite === 'string') {
      newCookie['samesite-flag'] = info.sameSite

      if (topLevelNavHostname !== null && topLevelNavHostname !== cDomain) {
        throw new JettaError('jetta-cookie-cross-site-on-samesite-cookie', options.preferredErrorLanguage)
      }
    }

    if (options.thirdPartyCookiesAllowed === false && topLevelNavHostname !== null && topLevelNavHostname !== cDomain) {
      throw new JettaError('jetta-cookie-no-third-party-cookies-allowed', options.preferredErrorLanguage)
    }

    existingCookie = this.getCookie(cName, cDomain, cPath)

    if (existingCookie !== null) {
      if (newCookie['http-only-flag'] === false && existingCookie['http-only-flag'] === true) {
        throw new JettaError('jetta-cookie-non-http-no-overwrite-httponly', options.preferredErrorLanguage)
      }

      newCookie['creation-time'] = existingCookie['creation-time']
    }

    if (isDeleteCookie === true) {
      this.deleteCookie(cName, cDomain, cPath)
    } else {
      if (typeof this.cookies[cDomain] !== 'object' || this.cookies[cDomain] === null) {
        this.cookies[cDomain] = {}
      }

      if (typeof this.cookies[cDomain][cPath] !== 'object' || this.cookies[cDomain][cPath] === null) {
        this.cookies[cDomain][cPath] = {}
      }

      this.cookies[cDomain][cPath][cName] = newCookie
      this.emit('addedCookie', Object.assign({domain: cDomain, path: cPath, name: cName}, newCookie))
    }
  }

  createCookieHeader (requestURL = null, givenOptions = {}) {
    // TEST: can throw if error with stringifyCookie or if request URL is invalid
    // NOTE: requestURL can be string or object
    // TEST: public suffix should be ok if set with public suffix
    this.deleteExpiredCookies()

    const allCookies = this.getCookies()
    const options = Object.assign({}, defaults.cookieManager, {publicSuffix: this.publicSuffix}, givenOptions)
    const parsedRequestURL = urlParser(requestURL, {addMissingProtocol: true, localhostAllowed: true})
    let cookiesToSendByPathLengthThenCreationTime = {}
    let cookiesToSendPathLengthKeys = []
    let cookiesToSendUnwound = []
    let topLevelNavHostname = null

    if (parsedRequestURL.isValid === false) {
      throw new JettaError('jetta-cookie-invalid-url', options.preferredErrorLanguage, {url: parsedRequestURL})
    }

    if (typeof options.topLevelURL === 'string') {
      const topLevelURLCandidate = urlParser(options.topLevelURL.replace(/^\.+/, ''), {addMissingProtocol: true, localhostAllowed: true})

      if (topLevelURLCandidate.isValid === true) {
        topLevelNavHostname = topLevelURLCandidate.parsedURL.hostname
      }
    }

    for (let i = 0, len = allCookies.length; i < len; i++) {
      const cookie = allCookies[i]

      if (cookie['host-only-flag'] === true) {
        if (cookie.domain !== parsedRequestURL.parsedURL.hostname) continue
      } else {
        if (parsedRequestURL.parsedURL.hostname.length === cookie.domain.length) {
          if (parsedRequestURL.parsedURL.hostname !== cookie.domain) continue
        } else if (parsedRequestURL.parsedURL.hostname.length > cookie.domain.length) {
          if (parsedRequestURL.parsedURL.hostname.slice(-(cookie.domain.length + 1)) !== `.${cookie.domain}`) continue
        } else {
          continue
        }
      }

      if (parsedRequestURL.parsedURL.pathname !== cookie.path) {
        if (parsedRequestURL.parsedURL.pathname.indexOf(cookie.path) === 0) {
          if (cookie.path[cookie.path.length - 1] !== '/' && parsedRequestURL.parsedURL.pathname.slice(cookie.path.length)[0] !== '/') {
            continue
          }
        } else {
          continue
        }
      }

      if (cookie['secure-only-flag'] === true && options.isSecureEnv !== true) continue
      if (cookie['http-only-flag'] === true && options.fromHttpApi === false) continue

      if (cookie['samesite-flag'] !== 'None') {
        if (cookie['samesite-flag'] === 'Lax') {
          if (CookieManager.safeHTTPMethods[options.requestMethod.toUpperCase()] !== true || options.isTopLevelBrowsingContext !== true) {
            continue
          }
        } else if (topLevelNavHostname !== null && topLevelNavHostname !== cookie.domain) {
          continue
        }
      }

      if (options.thirdPartyCookiesAllowed === false && topLevelNavHostname !== null && topLevelNavHostname !== cookie.domain) {
        continue
      }

      cookie['last-access-time'] = Date.now()

      if (cookiesToSendByPathLengthThenCreationTime[cookie.path.length] === 'object') {
        cookiesToSendByPathLengthThenCreationTime[cookie.path.length][cookiesToSendByPathLengthThenCreationTime[cookie.path.length].length] = cookie

        cookiesToSendByPathLengthThenCreationTime[cookie.path.length].sort((a, b) => {
          // TEST: earlier creation-times first
          if (a['creation-time'] < b['creation-time']) {
            return -1
          } else if (a['creation-time'] > b['creation-time']) {
            return 1
          } else {
            return 0
          }
        })
      } else {
        cookiesToSendByPathLengthThenCreationTime[cookie.path.length] = [cookie]
      }
    }

    // TEST: if no cookies are found

    cookiesToSendPathLengthKeys = Object.keys(cookiesToSendByPathLengthThenCreationTime).sort().reverse()

    for (let i = 0, len = cookiesToSendPathLengthKeys.length; i < len; i++) {
      const cookiesInPathLengthGroup = cookiesToSendByPathLengthThenCreationTime[cookiesToSendPathLengthKeys[i]]
      for (let j = 0, jLen = cookiesInPathLengthGroup.length; j < jLen; j++) {
        cookiesToSendUnwound[cookiesToSendUnwound.length] = cookiesInPathLengthGroup[j]
      }
    }

    return CookieManager.stringifyCookie(cookiesToSendUnwound, options)
  }

  deleteCookie (dName = '', dDomain = '', dPath = '') {
    let cookieToDeleteInfo = null
    let foundMatch = false

    // TEST: should delete domain and path trees, if empty

    if (typeof this.cookies[dDomain] !== 'object' || this.cookies[dDomain] === null) {
      return foundMatch
    }

    if (typeof this.cookies[dDomain][dPath] !== 'object' || this.cookies[dDomain][dPath] === null) {
      return foundMatch
    }

    if (typeof this.cookies[dDomain][dPath][dName] !== 'object' || this.cookies[dDomain][dPath][dName] === null) {
      return foundMatch
    }

    foundMatch = true
    cookieToDeleteInfo = Object.assign({domain: dDomain, path: dPath, name: dName}, this.cookies[dDomain][dPath][dName])

    delete this.cookies[dDomain][dPath][dName]
    this.emit('deletedCookie', cookieToDeleteInfo)

    if (Object.keys(this.cookies[dDomain][dPath]).length === 0) {
      delete this.cookies[dDomain][dPath]
    }

    if (Object.keys(this.cookies[dDomain]).length === 0) {
      delete this.cookies[dDomain]
    }

    return foundMatch
  }

  deleteExpiredCookies () {
    const domains = Object.keys(this.cookies)
    const now = Date.now()

    for (let i = 0, len = domains.length; i < len; i++) {
      const domainName = domains[i]
      const currentDomain = this.cookies[domainName]
      const paths = Object.keys(currentDomain)

      for (let j = 0, jLen = paths.length; j < jLen; j++) {
        const pathName = paths[j]
        const currentPath = this.cookies[domainName][pathName]
        const names = Object.keys(currentPath)

        for (let k = 0, kLen = names.length; k < kLen; k++) {
          const nameName = names[k]
          const cookie = this.cookies[domainName][pathName][nameName]

          if (Number.isSafeInteger(cookie['expiry-time']) === true && cookie['expiry-time'] < now) {
            this.deleteCookie(nameName, domainName, pathName)
          }
        }
      }
    }
  }

  deleteSessionCookies () {
    const domains = Object.keys(this.cookies)

    for (let i = 0, len = domains.length; i < len; i++) {
      const domainName = domains[i]
      const currentDomain = this.cookies[domainName]
      const paths = Object.keys(currentDomain)

      for (let j = 0, jLen = paths.length; j < jLen; j++) {
        const pathName = paths[j]
        const currentPath = this.cookies[domainName][pathName]
        const names = Object.keys(currentPath)

        for (let k = 0, kLen = names.length; k < kLen; k++) {
          const nameName = names[k]
          const cookie = this.cookies[domainName][pathName][nameName]

          if (cookie['persistent-flag'] === false) {
            this.deleteCookie(nameName, domainName, pathName)
          }
        }
      }
    }
  }

  getCookie (gName = '', gDomain = '', gPath = '') {
    // TEST: returns a single cookie || NULL
    this.deleteExpiredCookies()

    if (typeof this.cookies[gDomain] !== 'object' || this.cookies[gDomain] === null) {
      return null
    }

    if (typeof this.cookies[gDomain][gPath] !== 'object' || this.cookies[gDomain][gPath] === null) {
      return null
    }

    if (typeof this.cookies[gDomain][gPath][gName] !== 'object' || this.cookies[gDomain][gPath][gName] === null) {
      return null
    }

    return Object.assign({domain: gDomain, path: gPath, name: gName}, this.cookies[gDomain][gPath][gName])
  }

  getCookies (filter = {}) {
    // NOTE: filtering cookie search & a way to get all cookies as a list of objects
    // NOTE: filters: name = '', domain = '', path = ''
    let cookieList = []

    this.deleteExpiredCookies()

    const domains = Object.keys(this.cookies)

    for (let i = 0, len = domains.length; i < len; i++) {
      const domainName = domains[i]
      const currentDomain = this.cookies[domainName]

      if (typeof currentDomain !== 'object' || currentDomain === null) continue
      if (typeof filter.domain === 'string' && filter.domain !== domainName) continue

      const paths = Object.keys(currentDomain)

      for (let j = 0, jLen = paths.length; j < jLen; j++) {
        const pathName = paths[j]
        const currentPath = this.cookies[domainName][pathName]

        if (typeof currentPath !== 'object' || currentPath === null) continue
        if (typeof filter.path === 'string' && filter.path !== pathName) continue

        const names = Object.keys(currentPath)

        for (let k = 0, kLen = names.length; k < kLen; k++) {
          const nameName = names[k]
          const currentName = this.cookies[domainName][pathName][nameName]

          if (typeof currentName !== 'object' || currentName === null) continue
          if (typeof filter.name === 'string' && filter.name !== nameName) continue

          cookieList[cookieList.length] = Object.assign({domain: domainName, path: pathName, name: nameName}, this.cookies[domainName][pathName][nameName])
        }
      }
    }

    return cookieList
  }

  setReady () {
    this.ready = true
    this.emit('ready')
  }

  static parseCookie (cookieString = '', givenOptions = {}) {
    const options = Object.assign({}, defaults.cookieManager, givenOptions)
    const cookieList = cookieString.replace(CookieManager.trailingSemicolonRegex, '').split(';')

    let cookies = []

    for (let i = 0, len = cookieList.length; i < len; i++) {
      const cookieNameValuePair = cookieList[i].trim().split('=')
      let cookie = {
        get Name () { return this.name },
        set Name (v) { this.name = v },
        get Value () { return this.value },
        set Value (v) { this.value = v }
      }
      let name = ''
      let value = ''

      if (cookieNameValuePair.length < 2) {
        throw new JettaError('jetta-cookie-invalid-name-value-pair', options.preferredErrorLanguage)
      } else {
        name = cookieNameValuePair[0].trim()
        value = cookieNameValuePair.slice(1).join('=').trim()

        if (value[0] === '"' && value[value.length - 1] === '"') {
          value = value.slice(1, -1)
        }
      }

      if (CookieManager.validCookieNameRegex.test(name) === false) {
        throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
      }

      cookie.name = name

      if (CookieManager.validCookieValueRegex.test(value) === false) {
        throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
      }

      cookie.value = value

      cookies[cookies.length] = cookie
    }

    return cookies
  }

  static parseCookieKV (cookieString = '', givenOptions = {}) {
    const cookieList = CookieManager.parseCookie(cookieString, givenOptions)
    let cookies = {}

    for (let i = 0, len = cookieList.length; i < len; i++) {
      cookies[cookieList[i].name] = cookieList[i].value
    }

    return cookies
  }

  static parseSetCookie (cookieString = '', givenOptions = {}) {
    const options = Object.assign({}, defaults.cookieManager, givenOptions)
    const cookiePieces = cookieString.replace(CookieManager.trailingSemicolonRegex, '').split(';')

    let cookie = {
      name: null,
      value: null,
      Expires: null,
      'Max-Age': null,
      Domain: null,
      Path: null,
      Secure: null,
      HttpOnly: null,
      SameSite: null,
      get Name () { return this.name },
      set Name (v) { this.name = v },
      get Value () { return this.value },
      set Value (v) { this.value = v },
      get expires () { return this.Expires },
      set expires (v) { this.Expires = v },
      get 'max-age' () { return this['Max-Age'] },
      set 'max-age' (v) { this['Max-Age'] = v },
      get maxAge () { return this['Max-Age'] },
      set maxAge (v) { this['Max-Age'] = v },
      get domain () { return this.Domain },
      set domain (v) { this.Domain = v },
      get path () { return this.Path },
      set path (v) { this.Path = v },
      get secure () { return this.Secure },
      set secure (v) { this.Secure = v },
      get 'http-only' () { return this.HttpOnly },
      set 'http-only' (v) { this.HttpOnly = v },
      get 'Http-Only' () { return this.HttpOnly },
      set 'Http-Only' (v) { this.HttpOnly = v },
      get httponly () { return this.HttpOnly },
      set httponly (v) { this.HttpOnly = v },
      get httpOnly () { return this.HttpOnly },
      set httpOnly (v) { this.HttpOnly = v },
      get samesite () { return this.SameSite },
      set samesite (v) { this.SameSite = v },
      get sameSite () { return this.SameSite },
      set sameSite (v) { this.SameSite = v }
    }

    let parsedRequestURL = null

    if (options.requestURL !== null) {
      const requestURLCandidate = urlParser(options.requestURL.replace(/^\.+/, ''), {addMissingProtocol: true, localhostAllowed: true})

      if (requestURLCandidate.isValid === true) {
        parsedRequestURL = requestURLCandidate.parsedURL
      }
    }

    for (let i = 0, len = cookiePieces.length; i < len; i++) {
      const piece = cookiePieces[i].trim()

      if (i === 0) {
        const cookieNameValuePair = piece.split('=')
        let name = ''
        let value = ''

        if (cookieNameValuePair.length < 2) {
          throw new JettaError('jetta-cookie-invalid-name-value-pair', options.preferredErrorLanguage)
        } else {
          name = cookieNameValuePair[0].trim()
          value = cookieNameValuePair.slice(1).join('=').trim()

          if (value[0] === '"' && value[value.length - 1] === '"') {
            value = value.slice(1, -1)
          }
        }

        if (CookieManager.validCookieNameRegex.test(name) === false) {
          throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
        }

        cookie.name = name

        if (CookieManager.validCookieValueRegex.test(value) === false) {
          throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
        }

        cookie.value = value
      } else if (piece.length === 0) {
        continue
      } else {
        const cookieAttributePieces = piece.split('=')
        let attribute = cookieAttributePieces[0].trim()
        let attributeValue

        if (cookieAttributePieces.length === 1) {
          attributeValue = true
        } else {
          attributeValue = cookieAttributePieces.slice(1).join('=').trim()
        }

        switch (attribute.toLowerCase()) {
          case 'expires':
            const expiresDate = new Date(attributeValue)

            attribute = 'Expires'

            if (typeof attributeValue !== 'string' || Number.isSafeInteger(expiresDate.valueOf()) === false) {
              throw new JettaError('jetta-cookie-invalid-expires', options.preferredErrorLanguage)
            } else if (expiresDate.valueOf() < Date.now() && options.allowExpiredSetCookie !== true) {
              throw new JettaError('jetta-cookie-expired', options.preferredErrorLanguage, {attribute: 'Expires'})
            } else {
              attributeValue = expiresDate
            }
            break
          case 'max-age':
            const maxAgeSeconds = Number(attributeValue)

            attribute = 'Max-Age'

            if (typeof attributeValue !== 'string' || Number.isSafeInteger(maxAgeSeconds) === false) {
              throw new JettaError('jetta-cookie-invalid-max-age', options.preferredErrorLanguage)
            } else if (maxAgeSeconds < 1 && options.allowExpiredSetCookie !== true) {
              throw new JettaError('jetta-cookie-expired', options.preferredErrorLanguage, {attribute: 'Max-Age'})
            } else {
              attributeValue = maxAgeSeconds
            }
            break
          case 'domain':
            attribute = 'Domain'

            if (typeof attributeValue !== 'string') {
              throw new JettaError('jetta-cookie-invalid-domain-type', options.preferredErrorLanguage, {type: typeof attributeValue})
            }

            const domainCandidate = urlParser(attributeValue.replace(/^\.+/, ''), {addMissingProtocol: true, localhostAllowed: true})

            if (domainCandidate.isValid === false) {
              throw new JettaError('jetta-cookie-invalid-domain', options.preferredErrorLanguage, {domain: domainCandidate})
            }

            attributeValue = domainCandidate.parsedURL.hostname
            break
          case 'path':
            attribute = 'Path'

            if (typeof attributeValue !== 'string' || CookieManager.validPathValueRegex.test(attributeValue) === false) {
              throw new JettaError('jetta-cookie-invalid-path', options.preferredErrorLanguage, {path: attributeValue})
            }

            break
          case 'secure':
            attribute = 'Secure'

            if (attributeValue !== true) {
              throw new JettaError('jetta-cookie-invalid-secure', options.preferredErrorLanguage, {value: attributeValue})
            }

            break
          case 'httponly':
            attribute = 'HttpOnly'

            if (attributeValue !== true) {
              throw new JettaError('jetta-cookie-invalid-httponly', options.preferredErrorLanguage, {value: attributeValue})
            }

            if (options.fromHttpApi === false) {
              throw new JettaError('jetta-cookie-httponly-from-non-http-api', options.preferredErrorLanguage)
            }

            break
          case 'samesite':
            attribute = 'SameSite'

            if (typeof attributeValue === 'string' && attributeValue.toLowerCase() === 'lax') {
              attributeValue = 'Lax'
            } else {
              attributeValue = 'Strict'
            }
            break
          default:
            break
        }

        cookie[attribute] = attributeValue
      }
    }

    if (cookie.Secure !== undefined && options.isSecureEnv === false) {
      throw new JettaError('jetta-cookie-set-secure-attribute-not-secure-env', options.preferredErrorLanguage)
    }

    if (/^__Secure-/.test(cookie.name) === true) {
      if (options.isSecureEnv === false) {
        throw new JettaError('jetta-cookie-set-secure-prefix-not-secure-env', options.preferredErrorLanguage)
      }

      if (cookie.Secure !== true) {
        throw new JettaError('jetta-cookie-set-secure-prefix-missing-secure-attribute', options.preferredErrorLanguage)
      }
    }

    if (/^__Host-/.test(cookie.name) === true) {
      if (options.isSecureEnv === false) {
        throw new JettaError('jetta-cookie-set-host-prefix-not-secure-env', options.preferredErrorLanguage)
      }

      if (cookie.Secure !== true) {
        throw new JettaError('jetta-cookie-set-host-prefix-missing-secure-attribute', options.preferredErrorLanguage)
      }

      if (cookie.Domain !== undefined) {
        throw new JettaError('jetta-cookie-set-host-prefix-no-domain', options.preferredErrorLanguage)
      }

      if (cookie.Path !== '/') {
        throw new JettaError('jetta-cookie-set-host-prefix-path-not-root', options.preferredErrorLanguage)
      }
    }

    if (parsedRequestURL !== null && typeof parsedRequestURL.pathname === 'string' && typeof cookie.Path !== 'string') {
      // TEST: cookie.Path may not use current before checking __Host-, as __Host- requires explicit '/'
      // TEST: cookie's default pathname should not have a query string if there is a query string in the path
      // TEST: no trailing / if length > 1, test path and cookie header output, to be sure
      if (parsedRequestURL.pathname.length > 0 && CookieManager.validPathValueRegex.test(parsedRequestURL.pathname) === true) {
        if (parsedRequestURL.pathname.length > 1 && parsedRequestURL.pathname[parsedRequestURL.pathname.length - 1] === '/') {
          cookie.Path = parsedRequestURL.pathname.slice(0, -1)
        } else {
          cookie.Path = parsedRequestURL.pathname
        }
      } else {
        throw new JettaError('jetta-cookie-invalid-path', options.preferredErrorLanguage, {path: parsedRequestURL.pathname})
      }
    }

    if (parsedRequestURL !== null && typeof cookie.Domain === 'string') {
      // RFC 6265 Section 4.1.2.3
      if (parsedRequestURL.hostname.length === cookie.Domain.length && parsedRequestURL.hostname !== cookie.Domain) {
        throw new JettaError('jetta-cookie-hostname-not-in-env', options.preferredErrorLanguage, {hostname: parsedRequestURL.hostname, cookieDomain: cookie.Domain})
      } else if (parsedRequestURL.hostname.length > cookie.Domain.length && parsedRequestURL.hostname.slice(-(cookie.Domain.length + 1)) !== `.${cookie.Domain}`) {
        // TEST: Domain=.example to make sure this works consistently (should process via above switch)
        throw new JettaError('jetta-cookie-hostname-not-in-env', options.preferredErrorLanguage, {hostname: parsedRequestURL.hostname, cookieDomain: cookie.Domain})
      } else if (parsedRequestURL.hostname.length < cookie.Domain.length) {
        throw new JettaError('jetta-cookie-hostname-not-in-env', options.preferredErrorLanguage, {hostname: parsedRequestURL.hostname, cookieDomain: cookie.Domain})
      } else if (parsedRequestURL.hostname !== cookie.Domain && typeof options.publicSuffix === 'object' && options.publicSuffix !== null && options.publicSuffix.isPublicSuffix(cookie.Domain) === true) {
        // TEST: should be ok if parsedRequestURL.hostname is publicSuffix itself
        throw new JettaError('jetta-cookie-hostname-is-public-suffix', options.preferredErrorLanguage, {cookieDomain: cookie.Domain})
      }
    }

    return cookie
  }

  static stringifyCookie (cookieObjects = [], givenOptions = {}) {
    const options = Object.assign({}, defaults.cookieManager, givenOptions)

    let cookies = []

    for (let i = 0, len = cookieObjects.length; i < len; i++) {
      const cookie = cookieObjects[i]
      let name = cookie.name
      let value = cookie.value

      if (typeof name !== 'string' || CookieManager.validCookieNameRegex.test(name) === false) {
        throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
      }

      if (typeof value !== 'string') {
        throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
      }

      if (value[0] === '"' && value[value.length - 1] === '"') {
        value = value.slice(1, -1)
      }

      if (CookieManager.validCookieValueRegex.test(value) === false) {
        throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
      }

      cookies[cookies.length] = `${name}=${value}`
    }

    return cookies.join('; ')
  }

  static stringifyCookieKV (cookieObject = {}, givenOptions = {}) {
    const options = Object.assign({}, defaults.cookieManager, givenOptions)
    const cookieNames = Object.keys(cookieObject)

    let cookies = []

    for (let i = 0, len = cookieNames.length; i < len; i++) {
      let name = cookieNames[i]
      let value = cookieObject[name]

      cookies[cookies.length] = {name, value}
    }

    return CookieManager.stringifyCookie(cookies, options)
  }

  static stringifySetCookie (cookieObject = {}, givenOptions = {}) {
    const options = Object.assign({}, defaults.cookieManager, givenOptions)

    let setCookieString = ''
    let setCookieStringPieces = []
    let attributes = {
      name: cookieObject.name || cookieObject.Name,
      value: cookieObject.value || cookieObject.Value,
      expires: cookieObject.expires || cookieObject.Expires,
      maxAge: cookieObject['Max-Age'] || cookieObject['max-age'] || cookieObject.maxAge,
      domain: cookieObject.Domain || cookieObject.domain,
      path: cookieObject.Path || cookieObject.path,
      secure: cookieObject.Secure || cookieObject.secure,
      httpOnly: cookieObject.HttpOnly || cookieObject['http-only'] || cookieObject['Http-Only'] || cookieObject.httpOnly || cookieObject.httponly,
      sameSite: cookieObject.SameSite || cookieObject.sameSite || cookieObject.samesite
    }

    if (typeof attributes.name !== 'string' || CookieManager.validCookieNameRegex.test(attributes.name) === false) {
      throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
    }

    if (typeof attributes.value !== 'string') {
      throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
    }

    if (attributes.value[0] === '"' && attributes.value[attributes.value.length - 1] === '"') {
      attributes.value = attributes.value.slice(1, -1)
    }

    if (CookieManager.validCookieValueRegex.test(attributes.value) === false) {
      throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
    }

    setCookieStringPieces[setCookieStringPieces.length] = `${attributes.name}=${attributes.value}`

    if (attributes.expires instanceof Date) {
      setCookieStringPieces[setCookieStringPieces.length] = `Expires=${attributes.expires.toUTCString()}`
    }

    if (Number.isSafeInteger(attributes.maxAge)) {
      setCookieStringPieces[setCookieStringPieces.length] = `Max-Age=${attributes.maxAge}`
    }

    if (typeof attributes.domain === 'string') {
      setCookieStringPieces[setCookieStringPieces.length] = `Domain=${attributes.domain}`
    }

    if (typeof attributes.path === 'string') {
      setCookieStringPieces[setCookieStringPieces.length] = `Path=${attributes.path}`
    }

    if (attributes.secure === true) {
      setCookieStringPieces[setCookieStringPieces.length] = `Secure`
    }

    if (attributes.httpOnly === true) {
      setCookieStringPieces[setCookieStringPieces.length] = `HttpOnly`
    }

    if (attributes.sameSite === 'Lax' || attributes.sameSite === 'Strict') {
      setCookieStringPieces[setCookieStringPieces.length] = `SameSite=${attributes.sameSite}`
    }

    setCookieString = setCookieStringPieces.join('; ')

    // parse to validate created cookie, in case something is deemed invalid
    CookieManager.parseSetCookie(setCookieString, options)

    return setCookieString
  }

  static get safeHTTPMethods () {
    return {
      GET: true,
      HEAD: true,
      OPTIONS: true,
      TRACE: true
    }
  }

  static get validCookieNameRegex () {
    // validCookieNameRegex: 'cookie-name' === 'token' (RFC 6265 Section 4.1.1) -> 'token' (RFC 2616 Section 2.2)
    return /^[\u0021\u0023-\u0027\u002a-\u002b\u002d\u002e\u0030-\u0039\u0041-\u005a\u005e-\u007a\u007c\u007e]+$/
  }

  static get validCookieValueRegex () {
    // validCookieValueRegex: 'cookie-octet' (RFC 6265 Section 4.1.1)
    return /^[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*$/
  }

  static get validPathValueRegex () {
    // validPathValueRegex: 'path-value' (RFC 6265 Section 4.1.1)
    return /^[\u0020-\u003a\u003c-\u007E]*$/
  }

  static get trailingSemicolonRegex () {
    return /;$/
  }
}

module.exports = CookieManager
