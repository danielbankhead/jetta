'use strict'

async function deleteExpiredCookiesTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, deleteExpiredCookiesTests.name]
  const {m, cm, b} = sharedState
  const uniqueCookieExpireId = `${b.generate()}.com`

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieExpireId, value: '', domain: uniqueCookieExpireId, maxAge: 1})
  cm.cookies[uniqueCookieExpireId]['/'][uniqueCookieExpireId]['expiry-time'] = Date.now() - 1

  cm.deleteExpiredCookies()
  t.equal(cm.cookies[uniqueCookieExpireId], undefined, m(scope, `should delete expired cookies`))

  cm.cookies = {}
}

module.exports = deleteExpiredCookiesTests
