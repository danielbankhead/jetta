'use strict'

function stringifySetCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, stringifySetCookieTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.stringifySetCookie()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      jetta.cookieLib.stringifySetCookie('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.stringifySetCookie.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.stringifySetCookie.invalid[j])

      try {
        jetta.cookieLib.stringifySetCookie(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  for (let i = 0, len = config.stringifySetCookie.valid.length; i < len; i++) {
    const validGroup = Array.from(config.stringifySetCookie.valid[i])
    const nestedScope = [...scope, validGroup[0]]

    const results = jetta.cookieLib.stringifySetCookie(validGroup[0], validGroup[2])

    t.equal(typeof results, 'string', m(nestedScope, `should be a string`))
    t.equal(results, validGroup[1], m(nestedScope, `should be "${validGroup[1]}"`))
  }
}

module.exports = stringifySetCookieTests
