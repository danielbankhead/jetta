'use strict'

async function deleteSessionCookiesTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, deleteSessionCookiesTests.name]
  const {m, cm, b} = sharedState
  const uniqueCookieSessionId = `${b.generate()}.com`
  const uniqueCookieSessionId2 = `${b.generate()}.com`

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieSessionId, value: uniqueCookieSessionId, domain: uniqueCookieSessionId})
  cm.addCookie({name: uniqueCookieSessionId2, value: uniqueCookieSessionId2, domain: uniqueCookieSessionId2, maxAge: 1})

  cm.deleteSessionCookies()
  t.equal(cm.getCookies().length, 1, m(scope, `should delete session cookies`))

  cm.cookies = {}
}

module.exports = deleteSessionCookiesTests
