'use strict'

const validateCookieObject = require('./validate-cookie-object')

async function addCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, addCookieTests.name]
  const {config, errorCategory, m, ev, cm, b} = sharedState
  const uniqueCookieId = `${b.generate()}.com`
  const uniqueCookieExpireId = `${b.generate()}.com`
  const cachedMaxCookiesPerDomain = cm.maxCookiesPerDomain
  const cachedMaxCookies = cm.maxCookies
  const cachedpreferredErrorLanguage = cm.preferredErrorLanguage

  cm.cookies = {}

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    cm.preferredErrorLanguage = preferredErrorLanguage

    try {
      cm.addCookie()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie('n=v; Domain=com', {requestURL: 'example.com'})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `public suffix`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie('n=v', {requestURL: 'example.com', topLevelURL: ''})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `invalid topLevelURL`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie('n=v', {requestURL: 'example.com', topLevelURL: {hostname: 'not-example.com'}})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `third-party cookies disabled by default`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie('n=v; Domain=http-only.example.com; httpOnly')
      cm.addCookie('n=v; Domain=http-only.example.com')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `httpOnly cannot be overwritten by cookie w/o httpOnly`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie(`n=v; Domain=${'a'.repeat(cm.maxCookieByteLength)}.com;`)
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `should not exceed "maxCookieByteLength"`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.addCookie({name: 'n', value: 'v', domain: `${'a'.repeat(cm.maxCookieByteLength)}.com`})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `should not exceed "maxCookieByteLength" - OBJECT`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.addCookieStrings.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.addCookieStrings.invalid[j])

      try {
        cm.addCookie(invalidGroup[0], invalidGroup[1])
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup], e, errorCategory, preferredErrorLanguage})
      }
    }

    for (let j = 0, jLen = config.addCookieObjects.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.addCookieObjects.invalid[j])

      try {
        cm.addCookie(invalidGroup[0], invalidGroup[1])
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  cm.preferredErrorLanguage = cachedpreferredErrorLanguage

  for (let i = 0, len = config.addCookieStrings.valid.length; i < len; i++) {
    const validGroup = Array.from(config.addCookieStrings.valid[i])
    const cookieObject = cm.addCookie(validGroup[0], validGroup[1])

    validateCookieObject(t, [...scope, validGroup], Object.assign({}, sharedState, {cookieObject}))

    cm.cookies = {}
  }

  for (let i = 0, len = config.addCookieObjects.valid.length; i < len; i++) {
    const validGroup = Array.from(config.addCookieStrings.valid[i])
    const cookieObject = cm.addCookie(validGroup[0], validGroup[1])

    validateCookieObject(t, [...scope, validGroup], Object.assign({}, sharedState, {cookieObject}))

    cm.cookies = {}
  }

  cm.cookies = {}

  t.false(cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})['persistent-flag'], m(scope, `cookies created without Expires or Max-Age should be a session cookie (persistent-flag === false)`))

  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', expires: Date.now() + 10000})['persistent-flag'], m(scope, `cookies created with Expires should be a persistent cookie`))
  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', expires: Date.now() + 10000})['expiry-time'] > Date.now(), m(scope, `cookies created with Max-Age should have an expiry-time later than now`))

  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', maxAge: 10})['persistent-flag'], m(scope, `cookies created with Max-Age should be a persistent cookie`))
  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', maxAge: 10})['expiry-time'] > Date.now(), m(scope, `cookies created with Max-Age should have an expiry-time later than now`))

  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', expires: Date.now() + 10000, maxAge: 20})['expiry-time'] > (Date.now() + 15000), m(scope, `cookies created with Expires or Max-Age should prefer Max-Age (Expires < Max-Age check)`))
  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', expires: Date.now() + 20000, maxAge: 10})['expiry-time'] < (Date.now() + 15000), m(scope, `cookies created with Expires or Max-Age should prefer Max-Age (Expires > Max-Age check)`))

  t.true(cm.addCookie({name: 'n', value: 'v', domain: 'example.com', secure: true})['secure-only-flag'], m(scope, `cookies created with Secure should have a 'secure-only-flag'`))

  await new Promise((resolve, reject) => {
    function addedCookieHandler (cookieObject) {
      if (cookieObject.name === uniqueCookieId) {
        t.pass(m(scope, `should fire an 'addedCookie' event when a new cookie has been added`))
        t.equal(typeof cm.cookies[cookieObject.domain][cookieObject.path][cookieObject.name], 'object', m(scope, `should create a nested cookie object path to cookie object once added`))

        cm.removeListener('addedCookie', addedCookieHandler)

        resolve()
      }
    }

    cm.on('addedCookie', addedCookieHandler)

    cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId})
  })

  await new Promise((resolve, reject) => {
    function updatedCookieHandler (cookieObject) {
      if (cookieObject.name === uniqueCookieId) {
        t.pass(m(scope, `should fire an 'updatedCookie' event when a cookie has been updated`))
        t.equal(typeof cm.cookies[cookieObject.domain][cookieObject.path][cookieObject.name], 'object', m(scope, `should have a nested cookie object path to updated cookie object`))

        cm.removeListener('updatedCookie', updatedCookieHandler)

        resolve()
      }
    }

    cm.on('updatedCookie', updatedCookieHandler)

    cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId})
  })

  await new Promise((resolve, reject) => {
    function deleteCookieHandler (cookieObject) {
      if (cookieObject.name === uniqueCookieId) {
        t.pass(m(scope, `"deletedCookie" event\` should fire a 'deletedCookie' event when a new cookie has been deleted`))
        t.equal(cm.cookies[cookieObject.domain], undefined, m(scope, `should delete a nested cookie object path if no more cookies are in the cookie object path`))

        cm.removeListener('deletedCookie', deleteCookieHandler)

        resolve()
      }
    }

    cm.on('deletedCookie', deleteCookieHandler)

    cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId, maxAge: -1})
  })

  cm.cookies = {}

  cm.maxCookiesPerDomain = 64
  cm.maxCookies = 64

  for (let i = 0, len = cm.maxCookiesPerDomain; i < len; i++) {
    cm.addCookie({name: `n${i}`, value: `v${i}`, domain: `example.com`})
  }

  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})

  t.equal(cm.getCookies().length, 1, m(scope, `cookies should be emptied for a particular domain when domain surpasses "maxCookiesPerDomain"`))

  cm.cookies = {}

  for (let i = 0, len = cm.maxCookies; i < len; i++) {
    cm.addCookie({name: `n`, value: `v`, domain: `s${i}.example.com`})
  }

  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})

  t.equal(cm.getCookies().length, 1, m(scope, `cookies should be emptied for all domains when "maxCookies" as been reached`))

  cm.maxCookiesPerDomain = cachedMaxCookiesPerDomain
  cm.maxCookies = cachedMaxCookies

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieExpireId, value: '', domain: uniqueCookieExpireId, maxAge: 1})
  cm.cookies[uniqueCookieExpireId]['/'][uniqueCookieExpireId]['expiry-time'] = Date.now() - 1

  cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId, maxAge: -1})
  t.equal(cm.cookies[uniqueCookieExpireId], undefined, m(scope, `should delete expired cookies`))

  cm.cookies = {}
}

module.exports = addCookieTests
