'use strict'

async function deleteCookieTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, deleteCookieTests.name]
  const {m, cm, b} = sharedState
  const uniqueCookieId = `${b.generate()}.com`
  const uniqueCookieId2 = `${b.generate()}.com`

  cm.cookies = {}

  t.false(cm.deleteCookie(undefined), m([...scope, undefined], `should be false`))
  t.false(cm.deleteCookie(null), m([...scope, null], `should be false`))
  t.false(cm.deleteCookie(''), m([...scope, ''], `should be false`))
  t.false(cm.deleteCookie([]), m([...scope, []], `should be false`))

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const deleteCookieObject = {
          name: i === 0 ? '' : null,
          path: j === 0 ? '' : null,
          domain: k === 0 ? '' : null
        }
        t.false(cm.deleteCookie(deleteCookieObject), m([...scope, deleteCookieObject], `should be false`))
      }
    }
  }

  cm.cookies = {a: {b: {c: null}}}

  t.false(cm.deleteCookie({name: 'c', path: 'b', domain: 'a'}), m([...scope, 'name = null'], `should be false`))

  cm.cookies['a']['b'] = null
  t.false(cm.deleteCookie({name: 'c', path: 'b', domain: 'a'}), m([...scope, 'path = null'], `should be false`))

  cm.cookies['a'] = null
  t.false(cm.deleteCookie({name: 'c', path: 'b', domain: 'a'}), m([...scope, 'domain = null'], `should be false`))

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId})

  await new Promise((resolve, reject) => {
    function deleteCookieHandler (cookieObject) {
      if (cookieObject.name === uniqueCookieId) {
        t.pass(m(scope, `"deletedCookie" event\` should fire a 'deletedCookie' event when a new cookie has been deleted`))
        t.equal(cm.cookies[cookieObject.domain], undefined, m(scope, `should delete a nested cookie object path if no more cookies are in the cookie object path`))

        cm.removeListener('deletedCookie', deleteCookieHandler)

        resolve()
      }
    }

    cm.on('deletedCookie', deleteCookieHandler)

    t.true(cm.deleteCookie({name: uniqueCookieId, domain: uniqueCookieId, path: '/'}), m(scope, `should return \`true\` if a cookie has been found & deleted`))
  })

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieId, value: uniqueCookieId, domain: uniqueCookieId, path: '/'})
  cm.addCookie({name: uniqueCookieId2, value: uniqueCookieId, domain: uniqueCookieId, path: '/'})
  cm.deleteCookie({name: uniqueCookieId, domain: uniqueCookieId, path: '/'})

  t.equal(typeof cm.cookies[uniqueCookieId]['/'], 'object', m(scope, `non-empty paths and directories should not be deleted`))

  cm.cookies = {}
}

module.exports = deleteCookieTests
