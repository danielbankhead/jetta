'use strict'

function parseSetCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, parseSetCookieTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  const artificialPublicSuffix = {isPublicSuffix: () => true}

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.parseSetCookie()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      jetta.cookieLib.parseSetCookie('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.parseSetCookie.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.parseSetCookie.invalid[j])

      try {
        jetta.cookieLib.parseSetCookie(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }

    try {
      jetta.cookieLib.parseSetCookie('com=test; Domain=com', {requestURL: 'example.com', publicSuffix: artificialPublicSuffix, preferredErrorLanguage})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `public suffix`], e, errorCategory, preferredErrorLanguage})
    }
  }

  for (let i = 0, len = config.parseSetCookie.valid.length; i < len; i++) {
    const validGroup = Array.from(config.parseSetCookie.valid[i])
    const nestedScope = [...scope, validGroup[0]]
    const results = jetta.cookieLib.parseSetCookie(validGroup[0], validGroup[2])
    const validateList = typeof validGroup[1] === 'object' ? Object.keys(validGroup[1]) : []

    t.true(results instanceof jetta.cookieLib.ParsedSetCookieHeader, m(nestedScope, `result should be an instance of jetta.cookieLib.ParsedSetCookieHeader`))
    t.notEqual(results, null, m(nestedScope, `should not be \`null\``))

    for (let j = 0, jLen = validateList.length; j < jLen; j++) {
      const item = validateList[j]
      if (validGroup[1][item] instanceof Date) {
        t.equal(results.Expires.valueOf(), validGroup[1][item].valueOf(), m([nestedScope, `.Expires.valueOf()`], `should be "${validGroup[1][item]}"`))
      } else {
        t.equal(results[item], validGroup[1][item], m([...nestedScope, item], `should be "${validGroup[1][item]}"`))
      }
    }

    t.equal(results.name, results.Name, m(nestedScope, `.Name should be a getter to .name`))
    t.equal(results.value, results.Value, m(nestedScope, `.Value should be a getter to .value`))
    t.equal(results.Expires, results.expires, m(nestedScope, `.expires should be a getter to .Expires`))
    t.equal(results['Max-Age'], results['max-age'], m(nestedScope, `.max-age should be a getter to .Max-Age`))
    t.equal(results['Max-Age'], results.maxAge, m(nestedScope, `.maxAge should be a getter to .Max-Age`))
    t.equal(results.Domain, results.domain, m(nestedScope, `.domain should be a getter to .Domain`))
    t.equal(results.Path, results.path, m(nestedScope, `.path should be a getter to .Path`))
    t.equal(results.Secure, results.secure, m(nestedScope, `.secure should be a getter to .Secure`))
    t.equal(results.HttpOnly, results['http-only'], m(nestedScope, `.http-only should be a getter to .HttpOnly`))
    t.equal(results.HttpOnly, results['Http-Only'], m(nestedScope, `.Http-Only should be a getter to .HttpOnly`))
    t.equal(results.HttpOnly, results.httponly, m(nestedScope, `.httponly should be a getter to .HttpOnly`))
    t.equal(results.HttpOnly, results.httpOnly, m(nestedScope, `.httpOnly should be a getter to .HttpOnly`))
    t.equal(results.SameSite, results.samesite, m(nestedScope, `.samesite should be a getter to .SameSite`))
    t.equal(results.SameSite, results.sameSite, m(nestedScope, `.sameSite should be a getter to .SameSite`))

    results.Name = 'testSetter'
    t.equal(results.name, results.Name, m(nestedScope, `.Name should be a setter to .name`))

    results.Value = 'testSetterValue'
    t.equal(results.value, results.Value, m(nestedScope, `.Value should be a setter to .value`))

    results.expires = new Date()
    t.equal(results.Expires, results.expires, m(nestedScope, `.expires should be a setter to .Expires`))

    results['max-age'] = results['Max-Age'] - 5
    t.equal(results['Max-Age'], results['max-age'], m(nestedScope, `.max-age should be a setter to .Max-Age`))

    results['max-age'] = results['Max-Age'] + 5
    t.equal(results['Max-Age'], results.maxAge, m(nestedScope, `.maxAge should be a setter to .Max-Age`))

    results.maxAge = results.maxAge + 10
    t.equal(results.maxAge, results.maxAge, m(nestedScope, `.maxAge should be a setter to .Max-Age`))

    results.domain = 'foo.bar.baz.example.com'
    t.equal(results.Domain, results.domain, m(nestedScope, `.domain should be a setter to .Domain`))

    results.path = results.Path + '/foo/bar'
    t.equal(results.Path, results.path, m(nestedScope, `.path should be a setter to .Path`))

    results.secure = 5
    t.equal(results.Secure, results.secure, m(nestedScope, `.secure should be a setter to .Secure`))

    results['http-only'] = 0
    t.equal(results.HttpOnly, results['http-only'], m(nestedScope, `.http-only should be a setter to .HttpOnly`))

    results['Http-Only'] = 1
    t.equal(results.HttpOnly, results['Http-Only'], m(nestedScope, `.Http-Only should be a setter to .HttpOnly`))

    results.httponly = 2
    t.equal(results.HttpOnly, results.httponly, m(nestedScope, `.httponly should be a setter to .HttpOnly`))

    results.httpOnly = 3
    t.equal(results.HttpOnly, results.httpOnly, m(nestedScope, `.httpOnly should be a setter to .HttpOnly`))

    results.samesite = 'foobar1'
    t.equal(results.SameSite, results.samesite, m(nestedScope, `.samesite should be a setter to .SameSite`))

    results.sameSite = 'foobar2'
    t.equal(results.SameSite, results.sameSite, m(nestedScope, `.sameSite should be a setter to .SameSite`))
  }

  t.doesNotThrow(() => {
    jetta.cookieLib.parseSetCookie('com=test; Domain=com', {requestURL: 'com', publicSuffix: artificialPublicSuffix})
  }, m(scope, `should not throw public suffix error if requestURL is a public suffix itself`))
  t.doesNotThrow(() => {
    jetta.cookieLib.parseSetCookie('com=test; Domain=com', {publicSuffix: artificialPublicSuffix})
  }, m(scope, `should not throw public suffix error if requestURL is not given`))
}

module.exports = parseSetCookieTests
