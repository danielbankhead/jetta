'use strict'

function parseCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, parseCookieTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.parseCookie()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      jetta.cookieLib.parseCookie('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.parseCookie.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.parseCookie.invalid[j])

      try {
        jetta.cookieLib.parseCookie(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  for (let i = 0, len = config.parseCookie.valid.length; i < len; i++) {
    const validGroup = Array.from(config.parseCookie.valid[i])
    const nestedScope = [...scope, validGroup[0]]
    const results = jetta.cookieLib.parseCookie(validGroup[0], validGroup[1])

    t.true(results instanceof Array, m(nestedScope, `should be an Array`))

    for (let j = 0, jLen = results.length; j < jLen; j++) {
      const result = results[j]

      t.true(result instanceof jetta.cookieLib.ParsedCookieHeader, m(nestedScope, `result should be an instance of jetta.cookieLib.ParsedCookieHeader`))

      t.equal(result.name, result.Name, m(nestedScope, `.Name should be a getter to .name`))
      t.equal(result.value, result.Value, m(nestedScope, `.Value should be a getter to .value`))

      result.Name = 'testSetter'
      result.Value = 'testSetterValue'

      t.equal(result.name, result.Name, m(nestedScope, `.Name should be a setter to .name`))
      t.equal(result.value, result.Value, m(nestedScope, `.Value should be a setter to .value`))
    }
  }
}

module.exports = parseCookieTests
