'use strict'

const validateCookieObject = require('./validate-cookie-object')

async function getCookiesTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, getCookiesTests.name]
  const {m, cm, b} = sharedState
  const uniqueCookieExpireId = `${b.generate()}.com`

  cm.cookies = {}

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})

  cm.cookies['example.com']['/']['n'] = null
  t.equal(cm.getCookies({name: 'n', value: 'v', domain: 'example.com'}).length, 0, m(scope, `should not return any cookies where [domain][path][name] branch === null`))

  cm.cookies['example.com']['/'] = null
  t.equal(cm.getCookies({name: 'n', value: 'v', domain: 'example.com'}).length, 0, m(scope, `should not return any cookies where [domain][path] branch === null`))

  cm.cookies['example.com'] = null
  t.equal(cm.getCookies({name: 'n', value: 'v', domain: 'example.com'}).length, 0, m(scope, `should not return any cookies where [domain] branch === null`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', path: '/'})
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', path: '/some/where'})
  cm.addCookie({name: 'n', value: 'v', domain: 'sub.example.com', path: '/'})
  cm.addCookie({name: 'n1', value: 'v', domain: 'example.com', path: '/'})

  t.equal(cm.getCookies({name: 'n', domain: 'example.com', path: '/'}).length, 1, m(scope, `should properly filter requested cookies`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', path: '/'})

  for (let i = 0; i < 5; i++) {
    const nestedScope = [...scope, 'matrix check']
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 5; k++) {
        const filters = {}

        if (i === 0) {
          filters.name = 'n'
        } else if (i === 1) {
          filters.name = null
        } else if (i === 2) {
          filters.name = undefined
        } else if (i === 3) {
          filters.name = ''
        } else {
          filters.name = 'no-exist'
        }

        if (j === 0) {
          filters.domain = 'example.com'
        } else if (j === 1) {
          filters.domain = null
        } else if (j === 2) {
          filters.domain = undefined
        } else if (j === 3) {
          filters.name = ''
        } else {
          filters.name = 'no-exist'
        }

        if (k === 0) {
          filters.path = '/'
        } else if (k === 1) {
          filters.path = null
        } else if (k === 2) {
          filters.path = undefined
        } else if (k === 3) {
          filters.name = ''
        } else {
          filters.name = 'no-exist'
        }

        if (filters.name === 'no-exist' || filters.domain === 'no-exist' || filters.path === 'no-exist') {
          t.equal(cm.getCookies(filters).length, 0, m([...nestedScope, filters], `should work`))
        } else {
          t.equal(cm.getCookies(filters).length, 1, m([...nestedScope, filters], `should return an array with cookie(s)`))
          validateCookieObject(t, [...nestedScope, filters], Object.assign({}, sharedState, {cookieObject: cm.getCookies(filters)[0]}))
        }
      }
    }
  }

  cm.addCookie({name: 'n2', value: 'v', domain: 'other.example.com', path: '/some/path'})
  t.equal(cm.getCookies({name: 'n2'}).length, 1, m(scope, `filter should work when multiple cookies are present`))
  validateCookieObject(t, scope, Object.assign({}, sharedState, {cookieObject: cm.getCookies({name: 'n2'})[0]}))

  t.equal(cm.getCookies({domain: 'other.example.com'}).length, 1, m(scope, `filter should work when multiple cookies are present`))
  validateCookieObject(t, scope, Object.assign({}, sharedState, {cookieObject: cm.getCookies({domain: 'other.example.com'})[0]}))

  t.equal(cm.getCookies({path: '/some/path'}).length, 1, m(scope, `filter should work when multiple cookies are present`))
  validateCookieObject(t, scope, Object.assign({}, sharedState, {cookieObject: cm.getCookies({path: '/some/path'})[0]}))

  cm.cookies = {}
  cm.addCookie({name: uniqueCookieExpireId, value: '', domain: uniqueCookieExpireId, maxAge: 1})
  cm.cookies[uniqueCookieExpireId]['/'][uniqueCookieExpireId]['expiry-time'] = Date.now() - 1

  t.equal(cm.getCookies().length, 0, m(scope, `should delete expired cookies`))

  cm.cookies = {}
}

module.exports = getCookiesTests
