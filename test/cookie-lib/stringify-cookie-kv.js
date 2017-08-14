'use strict'

function stringifyCookieKVTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, stringifyCookieKVTests.name]
  const {jetta, config, errorCategory, m, ev} = sharedState

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.cookieLib.stringifyCookieKV('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    for (let j = 0, jLen = config.stringifyCookieKV.invalid.length; j < jLen; j++) {
      const invalidGroup = Array.from(config.stringifyCookieKV.invalid[j])

      try {
        jetta.cookieLib.stringifyCookieKV(invalidGroup[0], Object.assign({}, invalidGroup[1], {preferredErrorLanguage}))
        throw new Error()
      } catch (e) {
        ev({t, scope: [...scope, invalidGroup[0]], e, errorCategory, preferredErrorLanguage})
      }
    }
  }

  t.equal(jetta.cookieLib.stringifyCookieKV(), '', m([...scope, `No options`], `should be an empty string`))

  for (let i = 0, len = config.stringifyCookieKV.valid.length; i < len; i++) {
    const validGroup = Array.from(config.stringifyCookieKV.valid[i])
    const nestedScope = [...scope, validGroup[0]]
    const results = jetta.cookieLib.stringifyCookieKV(validGroup[0], validGroup[2])
    const validateList = typeof validGroup[1] === 'object' ? Object.keys(validGroup[1]) : []
    const parsedResults = results === '' ? {} : jetta.cookieLib.parseCookie(results)

    t.equal(typeof results, 'string', m(nestedScope, `should be a string`))

    for (let j = 0, jLen = validateList.length; j < jLen; j++) {
      const item = validateList[j]
      if (validGroup[1][item] instanceof Date) {
        t.equal(parsedResults.Expires.valueOf(), validGroup[1][item].valueOf(), m([...scope, `.Expires.valueOf()`], `should be "${validGroup[1][item]}"`))
      } else {
        t.equal(parsedResults[item], validGroup[1][item], m([...scope, item], `should be "${validGroup[1][item]}"`))
      }
    }
  }
}

module.exports = stringifyCookieKVTests
