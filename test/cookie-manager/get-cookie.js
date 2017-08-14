'use strict'

const validateCookieObject = require('./validate-cookie-object')

async function getCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, getCookieTests.name]
  const {m, cm, b} = sharedState
  const uniqueCookieExpireId = `${b.generate()}.com`

  cm.cookies = {}

  t.equal(cm.getCookie(), null, m(scope, `should return \`null\` if cookie not found`))
  t.equal(cm.getCookie({}), null, m(scope, `should return \`null\` when passed an empty object`))
  t.equal(cm.getCookie([1, 2, 3]), null, m(scope, `should return \`null\` when passed an array`))
  t.equal(cm.getCookie('some string'), null, m(scope, `should return \`null\` when passed a string`))
  t.equal(cm.getCookie(true), null, m(scope, `should return \`null\` when passed a \`true\``))
  t.equal(cm.getCookie(false), null, m(scope, `should return \`null\` when passed a \`false\``))

  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})

  for (let i = 0; i < 3; i++) {
    const nestedScope = [...scope, 'matrix check']
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        const params = {}

        if (i === 0) {
          params.name = 'n'
        } else if (i === 1) {
          params.name = null
        } else {
          params.name = undefined
        }

        if (j === 0) {
          params.domain = 'example.com'
        } else if (j === 1) {
          params.domain = null
        } else {
          params.domain = undefined
        }

        if (k === 0) {
          params.path = '/'
        } else if (k === 1) {
          params.path = null
        } else {
          params.path = undefined
        }

        if (typeof params.name === 'string' && typeof params.domain === 'string' && typeof params.path === 'string') {
          t.notEqual(cm.getCookie(params), null, m([...nestedScope, params], `should not return \`null\` if cookie found`))
          validateCookieObject(t, [...nestedScope, params], Object.assign({}, sharedState, {cookieObject: cm.getCookie(params)}))
        } else {
          t.equal(cm.getCookie(params), null, m([...nestedScope, params], `should return \`null\` if cookie not found`))
        }
      }
    }
  }

  cm.addCookie({name: uniqueCookieExpireId, value: '', domain: uniqueCookieExpireId, maxAge: 1})
  cm.cookies[uniqueCookieExpireId]['/'][uniqueCookieExpireId]['expiry-time'] = Date.now() - 1

  t.equal(cm.getCookie(uniqueCookieExpireId), null, m(scope, `should delete expired cookies`))

  cm.cookies = {}
}

module.exports = getCookieTests
