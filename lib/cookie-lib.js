#! /usr/local/bin/node
'use strict'

const defaults = require('../data/defaults')
const JettaError = require('./jetta-error')
const urlParser = require('./url-parser')

const safeHTTPMethods = {
  GET: true,
  HEAD: true,
  OPTIONS: true,
  TRACE: true
}
const trailingSemicolonRegex = /;$/

// validCookieNameRegex: 'cookie-name' === 'token' (RFC 6265 Section 4.1.1) -> 'token' (RFC 2616 Section 2.2)
const validCookieNameRegex = /^[\u0021\u0023-\u0027\u002a-\u002b\u002d\u002e\u0030-\u0039\u0041-\u005a\u005e-\u007a\u007c\u007e]+$/

// validCookieValueRegex: 'cookie-octet' (RFC 6265 Section 4.1.1)
const validCookieValueRegex = /^[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*$/

// validPathValueRegex: 'path-value' (RFC 6265 Section 4.1.1)
const validPathValueRegex = /^[\u0020-\u003a\u003c-\u007E]*$/

class ParsedCookieHeader {
  get Name () {
    return this.name
  }
  set Name (v) {
    this.name = v
  }
  get Value () {
    return this.value
  }
  set Value (v) {
    this.value = v
  }
}

class ParsedSetCookieHeader {
  constructor () {
    this.name = null
    this.value = null
    this.Expires = null
    this['Max-Age'] = null
    this.Domain = null
    this.Path = null
    this.Secure = null
    this.HttpOnly = null
    this.SameSite = null
  }

  get Name () {
    return this.name
  }
  set Name (v) {
    this.name = v
  }
  get Value () {
    return this.value
  }
  set Value (v) {
    this.value = v
  }
  get expires () {
    return this.Expires
  }
  set expires (v) {
    this.Expires = v
  }
  get 'max-age' () {
    return this['Max-Age']
  }
  set 'max-age' (v) {
    this['Max-Age'] = v
  }
  get maxAge () {
    return this['Max-Age']
  }
  set maxAge (v) {
    this['Max-Age'] = v
  }
  get domain () {
    return this.Domain
  }
  set domain (v) {
    this.Domain = v
  }
  get path () {
    return this.Path
  }
  set path (v) {
    this.Path = v
  }
  get secure () {
    return this.Secure
  }
  set secure (v) {
    this.Secure = v
  }
  get 'http-only' () {
    return this.HttpOnly
  }
  set 'http-only' (v) {
    this.HttpOnly = v
  }
  get 'Http-Only' () {
    return this.HttpOnly
  }
  set 'Http-Only' (v) {
    this.HttpOnly = v
  }
  get httponly () {
    return this.HttpOnly
  }
  set httponly (v) {
    this.HttpOnly = v
  }
  get httpOnly () {
    return this.HttpOnly
  }
  set httpOnly (v) {
    this.HttpOnly = v
  }
  get samesite () {
    return this.SameSite
  }
  set samesite (v) {
    this.SameSite = v
  }
  get sameSite () {
    return this.SameSite
  }
  set sameSite (v) {
    this.SameSite = v
  }
}

function parseCookie (cookieString = '', givenOptions = {}) {
  const options = Object.assign({}, defaults.cookie, givenOptions)
  const cookieList = cookieString.replace(trailingSemicolonRegex, '').split(';')

  let cookies = []

  for (let i = 0, len = cookieList.length; i < len; i++) {
    const cookieNameValuePair = cookieList[i].trim().split('=')
    let cookie = new ParsedCookieHeader()
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

    if (validCookieNameRegex.test(name) === false) {
      throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
    }

    cookie.name = name

    if (validCookieValueRegex.test(value) === false) {
      throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
    }

    cookie.value = value

    cookies[cookies.length] = cookie
  }

  return cookies
}

function parseCookieKV (cookieString = '', givenOptions = {}) {
  const cookieList = parseCookie(cookieString, givenOptions)
  let cookies = {}

  for (let i = 0, len = cookieList.length; i < len; i++) {
    cookies[cookieList[i].name] = cookieList[i].value
  }

  return cookies
}

function parseSetCookie (cookieString = '', givenOptions = {}) {
  const options = Object.assign({}, defaults.cookie, givenOptions)
  const cookiePieces = cookieString.replace(trailingSemicolonRegex, '').split(';')

  let cookie = new ParsedSetCookieHeader()
  let parsedRequestURL = null

  if (options.requestURL !== null) {
    const requestURLCandidate = urlParser(options.requestURL.replace(/^\.+/, ''), {addMissingProtocol: true})

    if (requestURLCandidate.isValid === true) {
      parsedRequestURL = requestURLCandidate.parsedURL
    } else {
      throw new JettaError('jetta-cookie-request-url-invalid', options.preferredErrorLanguage, requestURLCandidate)
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

      if (validCookieNameRegex.test(name) === false) {
        throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
      }

      cookie.name = name

      if (validCookieValueRegex.test(value) === false) {
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

          if (typeof attributeValue !== 'string' || attributeValue === '' || Number.isSafeInteger(maxAgeSeconds) === false) {
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

          const domainCandidate = urlParser(attributeValue.replace(/^\.+/, ''), {addMissingProtocol: true})

          if (domainCandidate.isValid === false) {
            throw new JettaError('jetta-cookie-invalid-domain', options.preferredErrorLanguage, {domain: domainCandidate})
          }

          attributeValue = domainCandidate.parsedURL.hostname
          break
        case 'path':
          attribute = 'Path'

          if (typeof attributeValue !== 'string' || validPathValueRegex.test(attributeValue) === false) {
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

    if (cookie.Domain !== null) {
      throw new JettaError('jetta-cookie-set-host-prefix-no-domain', options.preferredErrorLanguage)
    }

    if (cookie.Path !== '/') {
      throw new JettaError('jetta-cookie-set-host-prefix-path-not-root', options.preferredErrorLanguage)
    }
  }

  if (cookie.Secure === true && options.isSecureEnv === false) {
    throw new JettaError('jetta-cookie-set-secure-attribute-not-secure-env', options.preferredErrorLanguage)
  }

  if (parsedRequestURL !== null && typeof parsedRequestURL.pathname === 'string' && typeof cookie.Path !== 'string') {
    if (parsedRequestURL.pathname.length > 0 && validPathValueRegex.test(parsedRequestURL.pathname) === true) {
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
      throw new JettaError('jetta-cookie-hostname-not-in-env', options.preferredErrorLanguage, {hostname: parsedRequestURL.hostname, cookieDomain: cookie.Domain})
    } else if (parsedRequestURL.hostname.length < cookie.Domain.length) {
      throw new JettaError('jetta-cookie-hostname-not-in-env', options.preferredErrorLanguage, {hostname: parsedRequestURL.hostname, cookieDomain: cookie.Domain})
    } else if (parsedRequestURL.hostname !== cookie.Domain && typeof options.publicSuffix === 'object' && options.publicSuffix !== null && options.publicSuffix.isPublicSuffix(cookie.Domain) === true) {
      throw new JettaError('jetta-cookie-hostname-is-public-suffix', options.preferredErrorLanguage, {cookieDomain: cookie.Domain})
    }
  }

  return cookie
}

function stringifyCookie (cookieObjects = [], givenOptions = {}) {
  const options = Object.assign({}, defaults.cookie, givenOptions)

  let cookies = []

  if (cookieObjects instanceof Array !== true) {
    throw new JettaError('jetta-cookie-stringify-cookie-not-array', options.preferredErrorLanguage)
  }

  for (let i = 0, len = cookieObjects.length; i < len; i++) {
    const cookie = cookieObjects[i]
    let name = cookie.name
    let value = cookie.value

    if (typeof name !== 'string' || validCookieNameRegex.test(name) === false) {
      throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
    }

    if (typeof value !== 'string') {
      throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
    }

    if (value[0] === '"' && value[value.length - 1] === '"') {
      value = value.slice(1, -1)
    }

    if (validCookieValueRegex.test(value) === false) {
      throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
    }

    cookies[cookies.length] = `${name}=${value}`
  }

  return cookies.join('; ')
}

function stringifyCookieKV (cookieObject = {}, givenOptions = {}) {
  const options = Object.assign({}, defaults.cookie, givenOptions)

  if (typeof cookieObject !== 'object' || cookieObject === null) {
    throw new JettaError('jetta-cookie-stringify-cookie-kv-not-valid-object', options.preferredErrorLanguage)
  }

  const cookieNames = Object.keys(cookieObject)
  let cookies = []

  for (let i = 0, len = cookieNames.length; i < len; i++) {
    let name = cookieNames[i]
    let value = cookieObject[name]

    cookies[cookies.length] = {name, value}
  }

  return stringifyCookie(cookies, options)
}

function stringifySetCookie (cookieObject = {}, givenOptions = {}, parseValidatedAndUniformed = false) {
  const options = Object.assign({}, defaults.cookie, givenOptions)
  const useCookieObject = {}

  let setCookieString = ''
  let setCookieStringPieces = []
  let attributes = {}

  if (typeof cookieObject !== 'object' || cookieObject === null) {
    throw new JettaError('jetta-cookie-stringify-set-cookie-not-valid-object', options.preferredErrorLanguage)
  }

  Object.assign(useCookieObject, cookieObject)

  if (useCookieObject.name !== undefined) {
    attributes.name = useCookieObject.name
  } else if (useCookieObject.Name !== undefined) {
    attributes.name = useCookieObject.Name
  }

  delete useCookieObject.name
  delete useCookieObject.Name

  if (useCookieObject.value !== undefined) {
    attributes.value = useCookieObject.value
  } else if (useCookieObject.Value !== undefined) {
    attributes.value = useCookieObject.Value
  }

  delete useCookieObject.value
  delete useCookieObject.Value

  if (useCookieObject.expires !== undefined) {
    attributes.expires = useCookieObject.expires
  } else if (useCookieObject.Expires !== undefined) {
    attributes.expires = useCookieObject.Expires
  }

  delete useCookieObject.expires
  delete useCookieObject.Expires

  if (useCookieObject['Max-Age'] !== undefined) {
    attributes.maxAge = useCookieObject['Max-Age']
  } else if (useCookieObject['max-age'] !== undefined) {
    attributes.maxAge = useCookieObject['max-age']
  } else if (useCookieObject.maxAge !== undefined) {
    attributes.maxAge = useCookieObject.maxAge
  }

  delete useCookieObject['Max-Age']
  delete useCookieObject['max-age']
  delete useCookieObject.maxAge

  if (useCookieObject.Domain !== undefined) {
    attributes.domain = useCookieObject.Domain
  } else if (useCookieObject.domain !== undefined) {
    attributes.domain = useCookieObject.domain
  }

  delete useCookieObject.Domain
  delete useCookieObject.domain

  if (useCookieObject.Path !== undefined) {
    attributes.path = useCookieObject.Path
  } else if (useCookieObject.path !== undefined) {
    attributes.path = useCookieObject.path
  }

  delete useCookieObject.Path
  delete useCookieObject.path

  if (useCookieObject.Secure !== undefined) {
    attributes.secure = useCookieObject.Secure
  } else if (useCookieObject.secure !== undefined) {
    attributes.secure = useCookieObject.secure
  }

  delete useCookieObject.Secure
  delete useCookieObject.secure

  if (useCookieObject.HttpOnly !== undefined) {
    attributes.httpOnly = useCookieObject.HttpOnly
  } else if (useCookieObject['http-only'] !== undefined) {
    attributes.httpOnly = useCookieObject['http-only']
  } else if (useCookieObject['Http-Only'] !== undefined) {
    attributes.httpOnly = useCookieObject['Http-Only']
  } else if (useCookieObject.httpOnly !== undefined) {
    attributes.httpOnly = useCookieObject.httpOnly
  } else if (useCookieObject.httponly !== undefined) {
    attributes.httpOnly = useCookieObject.httponly
  }

  delete useCookieObject.HttpOnly
  delete useCookieObject['http-only']
  delete useCookieObject['Http-Only']
  delete useCookieObject.httpOnly
  delete useCookieObject.httponly

  if (useCookieObject.SameSite !== undefined) {
    attributes.sameSite = useCookieObject.SameSite
  } else if (useCookieObject.sameSite !== undefined) {
    attributes.sameSite = useCookieObject.sameSite
  } else if (useCookieObject.samesite !== undefined) {
    attributes.sameSite = useCookieObject.samesite
  }

  delete useCookieObject.SameSite
  delete useCookieObject.sameSite
  delete useCookieObject.samesite

  const remainingAttributes = Object.keys(useCookieObject)

  if (typeof attributes.name !== 'string' || validCookieNameRegex.test(attributes.name) === false) {
    throw new JettaError('jetta-cookie-invalid-name', options.preferredErrorLanguage)
  }

  if (typeof attributes.value !== 'string') {
    throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
  }

  if (attributes.value[0] === '"' && attributes.value[attributes.value.length - 1] === '"') {
    attributes.value = attributes.value.slice(1, -1)
  }

  if (validCookieValueRegex.test(attributes.value) === false) {
    throw new JettaError('jetta-cookie-invalid-value', options.preferredErrorLanguage)
  }

  setCookieStringPieces[setCookieStringPieces.length] = `${attributes.name}=${attributes.value}`

  if (attributes.expires instanceof Date) {
    setCookieStringPieces[setCookieStringPieces.length] = `Expires=${attributes.expires.toUTCString()}`
  } else if (typeof attributes.expires === 'string' || Number.isSafeInteger(attributes.expires) === true) {
    setCookieStringPieces[setCookieStringPieces.length] = `Expires=${(new Date(attributes.expires)).toUTCString()}`
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

  if (attributes.sameSite !== undefined && attributes.sameSite !== null && attributes.sameSite !== false) {
    if (typeof attributes.sameSite === 'string' && attributes.sameSite.toLowerCase() === 'lax') {
      setCookieStringPieces[setCookieStringPieces.length] = `SameSite=Lax`
    } else {
      setCookieStringPieces[setCookieStringPieces.length] = `SameSite=Strict`
    }
  }

  for (let i = 0, len = remainingAttributes.length; i < len; i++) {
    const attribute = remainingAttributes[i]

    if (useCookieObject[attribute] === true) {
      setCookieStringPieces[setCookieStringPieces.length] = `${attribute}`
    } else {
      setCookieStringPieces[setCookieStringPieces.length] = `${attribute}=${useCookieObject[attribute]}`
    }
  }

  setCookieString = setCookieStringPieces.join('; ')

  if (parseValidatedAndUniformed === true) {
    return setCookieString
  } else {
    const parsed = parseSetCookie(setCookieString, options)
    return stringifySetCookie(parsed, options, true)
  }
}

module.exports = {
  ParsedCookieHeader,
  ParsedSetCookieHeader,
  parseCookie,
  parseCookieKV,
  parseSetCookie,
  stringifyCookie,
  stringifyCookieKV,
  stringifySetCookie,
  safeHTTPMethods,
  validCookieNameRegex,
  validCookieValueRegex,
  validPathValueRegex,
  trailingSemicolonRegex
}
