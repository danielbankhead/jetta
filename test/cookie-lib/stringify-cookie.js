'use strict'

function stringifyCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, stringifyCookieTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.stringifyCookie('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.stringifyCookie.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.stringifyCookie.invalid[j])

      try {
        jetta.cookieLib.stringifyCookie(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  t.equal(jetta.cookieLib.stringifyCookie(), '', m([...scope, `No options`], `should be an empty string`))

  for (let i = 0, len = config.stringifyCookie.valid.length; i < len; i++) {
    const validGroup = Array.from(config.stringifyCookie.valid[i])
    const nestedScope = [...scope, validGroup[0]]
    const results = jetta.cookieLib.stringifyCookie(validGroup[0], validGroup[2])

    t.equal(typeof results, 'string', m(nestedScope, `should be a string`))
    t.equal(results, validGroup[1], m(nestedScope, `should be "${validGroup[1]}"`))
  }
}

module.exports = stringifyCookieTests
