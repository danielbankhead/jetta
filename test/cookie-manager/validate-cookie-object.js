'use strict'

function validateCookieObject (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, validateCookieObject.name]
  const {jetta, m, cookieObject} = sharedState

  t.equal(typeof cookieObject, 'object', m(scope, `should be an object`))
  t.true(cookieObject instanceof jetta.CookieManagerCookie, m(scope, `should be an instance of jetta.CookieManagerCookie`))
  t.notEqual(typeof cookieObject, null, m(scope, `should not be null`))

  t.equal(typeof cookieObject.name, 'string', m(scope, `"name" should be an string`))
  t.equal(typeof cookieObject.value, 'string', m(scope, `"value" should be an string`))
  t.equal(typeof cookieObject.domain, 'string', m(scope, `"domain" should be an string`))
  t.equal(typeof cookieObject.path, 'string', m(scope, `"path" should be an string`))
  t.true(cookieObject['expiry-time'] === null || Number.isSafeInteger(cookieObject['expiry-time']) === true, m(scope, `"expiry-time" should be null or a safe integer`))
  t.true(Number.isSafeInteger(cookieObject['creation-time']), m(scope, `"creation-time" should be a safe integer`))
  t.true(Number.isSafeInteger(cookieObject['last-access-time']), m(scope, `"last-access-time" should be a safe integer`))

  t.equal(typeof cookieObject['persistent-flag'], 'boolean', m(scope, `"persistent-flag" should be a boolean`))
  t.equal(typeof cookieObject['host-only-flag'], 'boolean', m(scope, `"host-only-flag" should be a boolean`))
  t.equal(typeof cookieObject['secure-only-flag'], 'boolean', m(scope, `"secure-only-flag" should be a boolean`))
  t.equal(typeof cookieObject['http-only-flag'], 'boolean', m(scope, `"http-only-flag" should be a boolean`))
  t.true(cookieObject['samesite-flag'] === 'None' || cookieObject['samesite-flag'] === 'Strict' || cookieObject['samesite-flag'] === 'Lax', m(scope, `"samesite-flag" should be "None", "Strict", or "Lax"`))
}

module.exports = validateCookieObject
