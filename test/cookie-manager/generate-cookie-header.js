'use strict'

async function generateCookieHeaderTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, generateCookieHeaderTests.name]
  const {config, errorCategory, m, ev, cm, b} = sharedState
  const uniqueCookieExpireId = `${b.generate()}.com`

  function expectedGeneratedSameSiteResult (options = {}) {
    if (options.sameSiteType === 'None') {
      return 'n=v'
    } else if (options.sameSiteType === 'Lax') {
      if (options.safeMethod === false || options.isTopLevelBrowsingContext === false) {
        return ''
      } else {
        return 'n=v'
      }
    } else {
      if (options.isSameSite === false) {
        return ''
      } else {
        return 'n=v'
      }
    }
  }

  cm.cookies = {}

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    cm.preferredErrorLanguage = preferredErrorLanguage

    try {
      cm.generateCookieHeader()
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `No options`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.generateCookieHeader('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Empty string`], e, errorCategory, preferredErrorLanguage})
    }

    try {
      cm.generateCookieHeader('example.com', {topLevelURL: '', preferredErrorLanguage})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `invalid topLevelURL`], e, errorCategory, preferredErrorLanguage})
    }
  }

  cm.cookies = {}

  t.equal(cm.generateCookieHeader('example.com'), '', m(scope, `should return an empty string if no cookies are available (with given options) for a domain`))
  t.equal(cm.generateCookieHeader({hostname: 'example.com'}), '', m(scope, `should accept a url-like object`))

  cm.cookies = {}

  cm.addCookie({name: 'n', value: 'v', path: '/'}, {requestURL: 'example.com'})

  t.equal(cm.generateCookieHeader('example.com'), 'n=v', m(scope, `should return Cookie string if cookie(s) have 'host-only-flag' and requestURL's hostname has the same hostname`))
  t.equal(cm.generateCookieHeader('sub.example.com'), '', m(scope, `should return an empty string if cookie(s) have 'host-only-flag' and requestURL's hostname is not the hostname`))
  t.equal(cm.generateCookieHeader({hostname: 'example.com'}), 'n=v', m(scope, `should return Cookie string if cookie(s) have 'host-only-flag' and requestURL's hostname has the same hostname - OBJECT`))
  t.equal(cm.generateCookieHeader({hostname: 'sub.example.com'}), '', m(scope, `should return an empty string if cookie(s) have 'host-only-flag' and requestURL's hostname is not the hostname - OBJECT`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'com'})

  t.equal(cm.generateCookieHeader('com'), 'n=v', m(scope, `should return public suffix domain if set with public suffix`))
  t.equal(cm.generateCookieHeader({hostname: 'com'}), 'n=v', m(scope, `should return public suffix domain if set with public suffix - OBJECT`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'sub.example.com'})

  cm.cookies['sub.example.com']['/']['n']['last-access-time'] = 0

  t.equal(cm.generateCookieHeader('example.com'), '', m(scope, `should not return cookie(s) for subdomains`))
  t.equal(cm.cookies['sub.example.com']['/']['n']['last-access-time'], 0, m(scope, `'last-access-time' should not change if not accessed`))

  t.equal(cm.generateCookieHeader('foo.sub.example.com'), 'n=v', m(scope, `should return cookie(s) for parent domains`))
  t.notEqual(cm.cookies['sub.example.com']['/']['n']['last-access-time'], 0, m(scope, `'last-access-time' should change on accessed`))

  cm.cookies['sub.example.com']['/']['n']['last-access-time'] = 0

  t.equal(cm.generateCookieHeader({hostname: 'example.com'}), '', m(scope, `should not return cookie(s) for subdomains - OBJECT`))
  t.equal(cm.cookies['sub.example.com']['/']['n']['last-access-time'], 0, m(scope, `'last-access-time' should not change if not accessed - OBJECT`))

  t.equal(cm.generateCookieHeader({hostname: 'foo.sub.example.com'}), 'n=v', m(scope, `should return cookie(s) for parent domains - OBJECT`))
  t.notEqual(cm.cookies['sub.example.com']['/']['n']['last-access-time'], 0, m(scope, `'last-access-time' should change on accessed - OBJECT`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', path: '/some'})

  t.equal(cm.generateCookieHeader('example.com/'), '', m(scope, `should not return cookie(s) for parent paths`))
  t.equal(cm.generateCookieHeader('example.com/some/'), 'n=v', m(scope, `should return cookie(s) for exact paths`))
  t.equal(cm.generateCookieHeader('example.com/some/path/x/y/z/'), 'n=v', m(scope, `should return cookie(s) for nested paths`))
  t.equal(cm.generateCookieHeader('example.com/some-where'), '', m(scope, `should not return cookie(s) for similar paths where prefix is the same, but directory is different`))
  t.equal(cm.generateCookieHeader({hostname: 'example.com', path: '/some-where'}), '', m(scope, `should not return cookie(s) for similar paths where prefix is the same, but directory is different`))
  t.equal(cm.generateCookieHeader('example.com/some?a=c'), 'n=v', m(scope, `should return cookie(s) for matching paths where the path has a querystring`))
  t.equal(cm.generateCookieHeader('example.com/some#hash'), 'n=v', m(scope, `should return cookie(s) for matching paths where the path has a hash`))
  t.equal(cm.generateCookieHeader('example.com/some/path/?a=c'), 'n=v', m(scope, `should return cookie(s) for nested paths where the path has a querystrings`))
  t.equal(cm.generateCookieHeader('example.com/some/path/#hash'), 'n=v', m(scope, `should return cookie(s) for nested paths where the path has a hash`))
  t.equal(cm.generateCookieHeader('example.com/some/?a=c#hash'), 'n=v', m(scope, `should return cookie(s) for nested paths where the path has a query string & hash`))
  t.equal(cm.generateCookieHeader({hostname: 'example.com', pathname: '/some/path/', hash: '#hash', query: '?a=c'}), 'n=v', m(scope, `should return cookie(s) for nested paths where the path has a query string & hash - OBJECT`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', secure: true})

  t.equal(cm.generateCookieHeader('example.com'), 'n=v', m(scope, `should get Secure cookie(s) by default`))
  t.equal(cm.generateCookieHeader('example.com', {isSecureEnv: true}), 'n=v', m(scope, `should get Secure cookie(s) when "isSecureEnv = true"`))
  t.equal(cm.generateCookieHeader('example.com', {isSecureEnv: false}), '', m(scope, `should get Secure cookie(s) when "isSecureEnv = false"`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com', httpOnly: true})

  t.equal(cm.generateCookieHeader('example.com'), 'n=v', m(scope, `should get HttpOnly cookie(s) by default`))
  t.equal(cm.generateCookieHeader('example.com', {fromHttpApi: true}), 'n=v', m(scope, `should get HttpOnly cookie(s) when "fromHttpApi = true"`))
  t.equal(cm.generateCookieHeader('example.com', {fromHttpApi: false}), '', m(scope, `should get HttpOnly cookie(s) when "fromHttpApi = false"`))

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})
  t.equal(cm.generateCookieHeader('unknown-protocol://example.com'), 'n=v', m(scope, `should get cookies from unknown protocols (and automatically infer path)`))

  cm.cookies = {}

  for (let i = 0, len = config.sameSiteTypes.length; i < len; i++) {
    const sameSiteType = config.sameSiteTypes[i]
    const nestedScope = [...scope, 'same-site-cookies']

    cm.cookies = {}
    cm.addCookie({name: 'n', value: 'v', domain: 'example.com', sameSite: sameSiteType === 'None' ? null : sameSiteType})

    for (let j = 0, jLen = config.sampleTopLevelNavDomains.length; j < jLen; j++) {
      const topLevelNavDomain = config.sampleTopLevelNavDomains[j][0]
      const isSameSite = config.sampleTopLevelNavDomains[j][1]

      for (let k = 0, kLen = 2; k < kLen; k++) {
        const isTopLevelBrowsingContext = k === 0
        let expected = ''
        let options = {
          isTopLevelBrowsingContext,
          requestURL: 'example.com',
          topLevelURL: topLevelNavDomain,
          thirdPartyCookiesAllowed: true
        }

        expected = expectedGeneratedSameSiteResult({sameSiteType, isSameSite, safeMethod: true, isTopLevelBrowsingContext})
        for (let l = 0, lLen = config.safeHTTPMethods.length; l < lLen; l++) {
          options.requestMethod = config.safeHTTPMethods[l]

          t.equal(cm.generateCookieHeader('example.com', options), expected, m([...nestedScope, sameSiteType, options], `should be ${expected}`))
        }

        expected = expectedGeneratedSameSiteResult({sameSiteType, isSameSite, safeMethod: false, isTopLevelBrowsingContext})
        for (let l = 0, lLen = config.unsafeHTTPMethods.length; l < lLen; l++) {
          options.requestMethod = config.unsafeHTTPMethods[l]

          t.equal(cm.generateCookieHeader('example.com', options), expected, m([...nestedScope, sameSiteType, options], `should be ${expected}`))
        }
      }
    }
  }

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})

  for (let i = 0, len = config.sampleTopLevelNavDomains.length; i < len; i++) {
    const expected = config.sampleTopLevelNavDomains[i][1] ? 'n=v' : ''
    const nestedScope = [...scope, 'third-party-cookies']
    let options = {
      requestURL: 'example.com',
      thirdPartyCookiesAllowed: false,
      topLevelURL: config.sampleTopLevelNavDomains[i][0]
    }

    for (let j = 0, jLen = config.safeHTTPMethods.length; j < jLen; j++) {
      options.requestMethod = config.safeHTTPMethods[j]

      t.equal(cm.generateCookieHeader('example.com', options), expected, m([...nestedScope, options], `should be ${expected}`))
    }

    for (let j = 0, jLen = config.unsafeHTTPMethods.length; j < jLen; j++) {
      options.requestMethod = config.unsafeHTTPMethods[j]

      t.equal(cm.generateCookieHeader('example.com', options), expected, m([...nestedScope, options], `should be ${expected}`))
    }
  }

  cm.cookies = {}
  cm.addCookie({name: 'n', value: 'v', domain: 'example.com'})
  cm.addCookie({name: 'a', value: 'b', domain: 'example.com', path: '/'})
  cm.addCookie({name: 'c', value: 'd', domain: 'example.com', path: '/some/where'})
  cm.addCookie({name: 'e', value: 'f', domain: 'sub.example.com', path: '/some/'})

  await new Promise((resolve, reject) => setTimeout(resolve, 1))

  cm.addCookie({name: 'g', value: 'h', domain: 'example.com', path: '/some/where/else/here'})
  cm.addCookie({name: 'i', value: 'j', domain: 'example.com', path: '/some/where/else'})

  cm.cookies['example.com']['/']['a']['creation-time'] = 1

  t.equal(cm.generateCookieHeader('super.sub.example.com/some/where/else/here/'), 'g=h; i=j; c=d; e=f; a=b; n=v', m(scope, `cookies should be sorted by path length, then by earliest creation time`))

  cm.cookies = {}
  cm.addCookie({name: 'a', value: 'b', domain: 'example.com', path: '/'})
  cm.addCookie({name: 'c', value: 'd', domain: 'example.com', path: '/'})

  cm.cookies['example.com']['/']['a']['creation-time'] = 1
  cm.cookies['example.com']['/']['c']['creation-time'] = 2

  t.equal(cm.generateCookieHeader('example.com/some/where/else/here/'), 'a=b; c=d', m(scope, `cookies with the domain and path length should be in creation-time order`))

  cm.cookies = {}

  cm.addCookie({name: uniqueCookieExpireId, value: '', domain: uniqueCookieExpireId, maxAge: 1})
  cm.cookies[uniqueCookieExpireId]['/'][uniqueCookieExpireId]['expiry-time'] = Date.now() - 1

  t.equal(cm.generateCookieHeader(uniqueCookieExpireId), '', m(scope, `should delete expired cookies`))

  cm.cookies = {}
}

module.exports = generateCookieHeaderTests
