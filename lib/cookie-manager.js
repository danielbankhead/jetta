#! /usr/local/bin/node
'use strict'

const events = require('events')

const cookieLib = require('./cookie-lib')
const defaults = require('../data/defaults')
const domainLib = require('./domain-lib')
const JettaError = require('./jetta-error')
const packageInfo = require('../package')
const PublicSuffix = require('./public-suffix')
const urlParser = require('./url-parser')

class CookieManagerCookie {
  constructor (params = {}) {
    Object.assign(this, params)
  }
}

class CookieManager extends events {
  constructor (options = {}) {
    super()

    Object.assign(this, defaults.cookieManager, options, {ready: false})

    if (this.publicSuffix instanceof PublicSuffix === false) {
      this.publicSuffix = new PublicSuffix(Object.assign({preferredErrorLanguage: this.preferredErrorLanguage}, this.publicSuffix, this.publicSuffixOptions))
    }

    if (this.publicSuffix.ready === true) {
      this.setReady()
    } else {
      this.publicSuffix.once('ready', () => this.setReady())
    }

    this.publicSuffix.on('error', (e) => this.handlePublicSuffixError(e))
    this.publicSuffix.on('updatedPublicSuffix', () => this.handleUpdatedPublicSuffix())
  }

  handlePublicSuffixError (error = {}) {
    this.emit('error', new JettaError('jetta-cookie-public-suffix-error', this.preferredErrorLanguage, error))
  }

  handleUpdatedPublicSuffix () {
    this.emit('updatedPublicSuffix')
  }

  destroy (destroyPublicSuffix = true) {
    const keys = Object.keys(this.constructor.keysToDestroy)

    if (destroyPublicSuffix === true) {
      this.publicSuffix.destroy()
    }

    for (let i = 0, len = keys.length; i < len; i++) {
      this[keys[i]] = null
    }
  }

  setReady () {
    process.nextTick(() => {
      this.ready = true
      this.emit('ready')
    })
  }

  export () {
    this.deleteExpiredCookies()
    const exportObject = Object.assign({}, this, {publicSuffix: null, jettaVersion: packageInfo.version})
    delete exportObject.publicSuffix
    return exportObject
  }

  addCookie (cookie = null, givenOptions = {}) {
    this.deleteExpiredCookies()

    const now = Date.now()
    const options = Object.assign({}, defaults.cookie, {publicSuffix: this.publicSuffix}, givenOptions)

    let topLevelNavHostname = null
    let parsedRequestURL = null

    if (typeof cookie !== 'string') {
      cookie = cookieLib.stringifySetCookie(cookie, options)
    }

    if (Buffer.byteLength(cookie) > this.maxCookieByteLength) {
      throw new JettaError('jetta-cookie-exceeded-max-cookie-byte-length', options.preferredErrorLanguage)
    }

    if (typeof options.topLevelURL === 'string' || (typeof options.topLevelURL === 'object' && options.topLevelURL !== null)) {
      const topLevelURLCandidate = urlParser(options.topLevelURL, {addMissingProtocol: true})

      if (topLevelURLCandidate.isValid === true) {
        topLevelNavHostname = topLevelURLCandidate.parsedURL.hostname
      } else {
        throw new JettaError('jetta-cookie-top-level-url-invalid', options.preferredErrorLanguage, {url: options.topLevelURL})
      }
    }

    if (options.requestURL !== null) {
      options.requestURL = options.requestURL.replace(/^\.+/, '')

      const requestURLCandidate = urlParser(options.requestURL, {addMissingProtocol: true})

      if (requestURLCandidate.isValid === true) {
        parsedRequestURL = requestURLCandidate.parsedURL
      } else {
        throw new JettaError('jetta-cookie-request-url-invalid', options.preferredErrorLanguage, requestURLCandidate)
      }
    }

    const data = cookieLib.parseSetCookie(cookie, options)

    let newCookie = {
      value: data.value,
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
    let updatedExistingCookie = false
    let isDeleteCookie = false

    let cName = data.name
    let cDomain = data.domain
    let cPath = data.path || '/'

    if (typeof data.maxAge === 'number') {
      newCookie['persistent-flag'] = true

      if (data.maxAge > 0) {
        newCookie['expiry-time'] = now + (data.maxAge * 1000)
      } else {
        isDeleteCookie = true
      }
    } else if (data.expires instanceof Date) {
      newCookie['persistent-flag'] = true

      if (data.expires.valueOf() > now) {
        newCookie['expiry-time'] = data.expires.valueOf()
      } else {
        isDeleteCookie = true
      }
    }

    if (typeof data.domain !== 'string') {
      newCookie['host-only-flag'] = true

      if (parsedRequestURL !== null) {
        cDomain = parsedRequestURL.hostname
      } else {
        throw new JettaError('jetta-cookie-no-valid-domain-for-use', options.preferredErrorLanguage)
      }
    }

    if (data.secure === true) {
      newCookie['secure-only-flag'] = true
    }

    if (data.httpOnly === true) {
      newCookie['http-only-flag'] = true
    }

    if (typeof data.sameSite === 'string') {
      newCookie['samesite-flag'] = data.sameSite

      if (topLevelNavHostname !== null && domainLib.domainInOtherDomain(topLevelNavHostname, cDomain) === false) {
        throw new JettaError('jetta-cookie-cross-site-on-samesite-cookie', options.preferredErrorLanguage)
      }
    }

    if (options.thirdPartyCookiesAllowed === false && topLevelNavHostname !== null && topLevelNavHostname !== cDomain) {
      throw new JettaError('jetta-cookie-no-third-party-cookies-allowed', options.preferredErrorLanguage)
    }

    existingCookie = this.getCookie({name: cName, domain: cDomain, path: cPath})

    if (existingCookie !== null) {
      if (newCookie['http-only-flag'] === false && existingCookie['http-only-flag'] === true) {
        throw new JettaError('jetta-cookie-non-http-no-overwrite-httponly', options.preferredErrorLanguage)
      }

      updatedExistingCookie = true

      newCookie['creation-time'] = existingCookie['creation-time']
    }

    const returnableCookie = new CookieManagerCookie(Object.assign({domain: cDomain, path: cPath, name: cName}, newCookie))

    if (isDeleteCookie === true) {
      this.deleteCookie({name: cName, domain: cDomain, path: cPath})
    } else {
      if (existingCookie === null) {
        if (this.getCookies({domain: cDomain}).length >= this.maxCookiesPerDomain) {
          this.cookies[cDomain] = {}
        }

        if (this.getCookies().length >= this.maxCookies) {
          this.cookies = {}
        }
      }

      if (typeof this.cookies[cDomain] !== 'object' || this.cookies[cDomain] === null) {
        this.cookies[cDomain] = {}
      }

      if (typeof this.cookies[cDomain][cPath] !== 'object' || this.cookies[cDomain][cPath] === null) {
        this.cookies[cDomain][cPath] = {}
      }

      this.cookies[cDomain][cPath][cName] = newCookie

      process.nextTick(() => {
        if (updatedExistingCookie === true) {
          this.emit('updatedCookie', returnableCookie)
        } else {
          this.emit('addedCookie', returnableCookie)
        }
      })
    }

    return returnableCookie
  }

  deleteCookie (cookieObject = {name: '', domain: '', path: ''}) {
    let deletedCookieObject = null
    let foundMatch = false

    if (typeof cookieObject !== 'object' || cookieObject === null) {
      return foundMatch
    }

    const d = cookieObject.domain
    const p = cookieObject.path
    const n = cookieObject.name

    if (typeof d !== 'string' || typeof p !== 'string' || typeof n !== 'string') {
      return foundMatch
    }

    if (typeof this.cookies[d] !== 'object' || this.cookies[d] === null) {
      return foundMatch
    }

    if (typeof this.cookies[d][p] !== 'object' || this.cookies[d][p] === null) {
      return foundMatch
    }

    if (typeof this.cookies[d][p][n] !== 'object' || this.cookies[d][p][n] === null) {
      return foundMatch
    }

    foundMatch = true
    deletedCookieObject = new CookieManagerCookie(Object.assign({domain: d, path: p, name: n}, this.cookies[d][p][n]))

    delete this.cookies[d][p][n]

    if (Object.keys(this.cookies[d][p]).length === 0) {
      delete this.cookies[d][p]
    }

    if (Object.keys(this.cookies[d]).length === 0) {
      delete this.cookies[d]
    }

    process.nextTick(() => {
      this.emit('deletedCookie', deletedCookieObject)
    })

    return foundMatch
  }

  deleteExpiredCookies () {
    const domains = Object.keys(this.cookies)
    const now = Date.now()

    for (let i = 0, len = domains.length; i < len; i++) {
      const domainName = domains[i]
      const currentDomain = this.cookies[domainName]

      if (typeof currentDomain !== 'object' || currentDomain === null) continue

      const paths = Object.keys(currentDomain)

      for (let j = 0, jLen = paths.length; j < jLen; j++) {
        const pathName = paths[j]
        const currentPath = this.cookies[domainName][pathName]

        if (typeof currentPath !== 'object' || currentPath === null) continue

        const names = Object.keys(currentPath)

        for (let k = 0, kLen = names.length; k < kLen; k++) {
          const nameName = names[k]
          const cookie = this.cookies[domainName][pathName][nameName]

          if (typeof cookie !== 'object' || cookie === null) continue

          if (Number.isSafeInteger(cookie['expiry-time']) === true && cookie['expiry-time'] < now) {
            this.deleteCookie({name: nameName, domain: domainName, path: pathName})
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
            this.deleteCookie({name: nameName, domain: domainName, path: pathName})
          }
        }
      }
    }
  }

  generateCookieHeader (requestURL = null, givenOptions = {}) {
    this.deleteExpiredCookies()

    const allCookies = this.getCookies()
    const options = Object.assign({}, defaults.cookie, {publicSuffix: this.publicSuffix}, givenOptions)
    const parsedRequestURL = urlParser(requestURL, {addMissingProtocol: true})
    let cookiesToSendByPathLengthThenCreationTime = {}
    let cookiesToSendUnwound = []
    let reverseSortedCookiePathLengths = []
    let topLevelNavHostname = null

    if (parsedRequestURL.isValid === false) {
      throw new JettaError('jetta-cookie-request-url-invalid', options.preferredErrorLanguage, parsedRequestURL)
    }

    if (typeof parsedRequestURL.parsedURL.pathname !== 'string') {
      parsedRequestURL.parsedURL.pathname = '/'
    }

    if (typeof options.topLevelURL === 'string' || (typeof options.topLevelURL === 'object' && options.topLevelURL !== null)) {
      const topLevelURLCandidate = urlParser(options.topLevelURL, {addMissingProtocol: true})

      if (topLevelURLCandidate.isValid === true) {
        topLevelNavHostname = topLevelURLCandidate.parsedURL.hostname
      } else {
        throw new JettaError('jetta-cookie-top-level-url-invalid', options.preferredErrorLanguage, {url: options.topLevelURL})
      }
    }

    for (let i = 0, len = allCookies.length; i < len; i++) {
      const cookie = allCookies[i]

      if (cookie['host-only-flag'] === true) {
        if (cookie.domain !== parsedRequestURL.parsedURL.hostname) continue
      } else if (domainLib.domainInOtherDomain(parsedRequestURL.parsedURL.hostname, cookie.domain) === false) {
        continue
      }

      if (parsedRequestURL.parsedURL.pathname !== cookie.path) {
        let requestPathNormalizedForChecking = parsedRequestURL.parsedURL.pathname

        if (requestPathNormalizedForChecking[requestPathNormalizedForChecking.length - 1] !== '/') {
          requestPathNormalizedForChecking = `${requestPathNormalizedForChecking}/`
        }

        if (requestPathNormalizedForChecking.indexOf(cookie.path) === 0) {
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
          if (cookieLib.safeHTTPMethods[options.requestMethod.toUpperCase()] !== true || options.isTopLevelBrowsingContext !== true) {
            continue
          }
        } else if (topLevelNavHostname !== null && domainLib.domainInOtherDomain(topLevelNavHostname, cookie.domain) === false) {
          continue
        }
      }

      if (options.thirdPartyCookiesAllowed === false && topLevelNavHostname !== null && domainLib.domainInOtherDomain(topLevelNavHostname, cookie.domain) === false) {
        continue
      }

      this.cookies[cookie.domain][cookie.path][cookie.name]['last-access-time'] = cookie['last-access-time'] = Date.now()

      if (cookiesToSendByPathLengthThenCreationTime[cookie.path.length] instanceof Array) {
        const pathLengthGroup = cookiesToSendByPathLengthThenCreationTime[cookie.path.length]
        let placeLast = true

        for (let i = 0, len = pathLengthGroup.length; i < len; i++) {
          if (pathLengthGroup[i]['creation-time'] > cookie['creation-time']) {
            const newSortOrder = [...pathLengthGroup.slice(0, i), cookie, ...pathLengthGroup.slice(i)]
            cookiesToSendByPathLengthThenCreationTime[cookie.path.length] = newSortOrder
            placeLast = false
            break
          }
        }

        if (placeLast === true) {
          pathLengthGroup[pathLengthGroup.length] = cookie
        }
      } else {
        const currentPathLength = cookie.path.length
        let placeLast = true

        for (let i = 0, len = reverseSortedCookiePathLengths.length; i < len; i++) {
          if (currentPathLength > reverseSortedCookiePathLengths[i]) {
            const newSortOrder = [...reverseSortedCookiePathLengths.slice(0, i), currentPathLength, ...reverseSortedCookiePathLengths.slice(i)]
            reverseSortedCookiePathLengths = newSortOrder
            placeLast = false
            break
          }
        }

        if (placeLast === true) {
          reverseSortedCookiePathLengths[reverseSortedCookiePathLengths.length] = currentPathLength
        }

        cookiesToSendByPathLengthThenCreationTime[cookie.path.length] = [cookie]
      }
    }

    for (let i = 0, len = reverseSortedCookiePathLengths.length; i < len; i++) {
      const cookiesInPathLengthGroup = cookiesToSendByPathLengthThenCreationTime[reverseSortedCookiePathLengths[i]]
      for (let j = 0, jLen = cookiesInPathLengthGroup.length; j < jLen; j++) {
        cookiesToSendUnwound[cookiesToSendUnwound.length] = cookiesInPathLengthGroup[j]
      }
    }

    return cookieLib.stringifyCookie(cookiesToSendUnwound, options)
  }

  getCookie (cookieObject = {name: '', domain: '', path: ''}) {
    this.deleteExpiredCookies()

    if (typeof cookieObject !== 'object' || cookieObject === null) {
      return null
    }

    const d = cookieObject.domain
    const p = cookieObject.path
    const n = cookieObject.name

    if (typeof this.cookies[d] !== 'object' || this.cookies[d] === null) {
      return null
    }

    if (typeof this.cookies[d][p] !== 'object' || this.cookies[d][p] === null) {
      return null
    }

    if (typeof this.cookies[d][p][n] !== 'object' || this.cookies[d][p][n] === null) {
      return null
    }

    return new CookieManagerCookie(Object.assign({domain: d, path: p, name: n}, this.cookies[d][p][n]))
  }

  getCookies (filter = {name: '', domain: '', path: ''}) {
    let cookieList = []

    this.deleteExpiredCookies()

    const domains = Object.keys(this.cookies)

    for (let i = 0, len = domains.length; i < len; i++) {
      const domainName = domains[i]
      const currentDomain = this.cookies[domainName]

      if (typeof currentDomain !== 'object' || currentDomain === null) continue
      if (typeof filter.domain === 'string' && filter.domain !== '' && filter.domain !== domainName) continue

      const paths = Object.keys(currentDomain)

      for (let j = 0, jLen = paths.length; j < jLen; j++) {
        const pathName = paths[j]
        const currentPath = this.cookies[domainName][pathName]

        if (typeof currentPath !== 'object' || currentPath === null) continue
        if (typeof filter.path === 'string' && filter.path !== '' && filter.path !== pathName) continue

        const names = Object.keys(currentPath)

        for (let k = 0, kLen = names.length; k < kLen; k++) {
          const nameName = names[k]
          const currentName = this.cookies[domainName][pathName][nameName]

          if (typeof currentName !== 'object' || currentName === null) continue
          if (typeof filter.name === 'string' && filter.name !== '' && filter.name !== nameName) continue

          cookieList[cookieList.length] = new CookieManagerCookie(Object.assign({domain: domainName, path: pathName, name: nameName}, this.cookies[domainName][pathName][nameName]))
        }
      }
    }

    return cookieList
  }

  static get keysToDestroy () {
    return {
      cookies: true,
      publicSuffix: true,
      ready: true
    }
  }
}

module.exports = {
  CookieManager,
  CookieManagerCookie
}
