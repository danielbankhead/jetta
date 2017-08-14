'use strict'

function parseCookieKVTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, parseCookieKVTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.parseCookieKV()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      jetta.cookieLib.parseCookieKV('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.parseCookie.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.parseCookie.invalid[j])

      try {
        jetta.cookieLib.parseCookieKV(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  for (let i = 0, len = config.parseCookie.valid.length; i < len; i++) {
    const validGroup = Array.from(config.parseCookie.valid[i])
    const nestedScope = [...scope, validGroup[0]]
    const results = jetta.cookieLib.parseCookieKV(validGroup[0], validGroup[1])
    const names = Object.keys(results)

    t.equal(typeof results, 'object', m(nestedScope, `should be an object`))
    t.notEqual(results, null, m(nestedScope, `should not be \`null\``))

    for (let j = 0, jLen = names.length; j < jLen; j++) {
      t.equal(typeof results[names[j]], 'string', m([...nestedScope, names[j]], `should have a value`))
    }
  }
}

module.exports = parseCookieKVTests
