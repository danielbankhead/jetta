'use strict'

const crypto = require('crypto')
const fs = require('fs')

const sharedOptionsTests = require('../shared-options')
const uniformResultsExecutor = require('../uniform-results-executor')

async function httpProtocolsTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, httpProtocolsTests.name]
  const {jetta, config, defaults, m, servers, engineConfig} = sharedState

  async function protocolTest (protocol = '') {
    const nestedScope = [...scope, protocol]
    const serverSet = servers[protocol]
    let sharedOptionsParams = {
      testURL: null,
      sha384Base64Checksum: crypto.createHash('sha384').update(config.httpProtocols.jsonResponse.stringified).digest('base64'),
      socketPath: serverSet.json.address(),
      pathname: '/',
      protocol: `${protocol}:`
    }

    function rParams (expectedOK = true, serverName = '', url, options, state) {
      if (typeof options.requestOptions !== 'object' || options.requestOptions === null) {
        options.requestOptions = {pathname: '/'}
      }

      if (protocol === 'https') {
        options.requestOptions = Object.assign(options.requestOptions, config.TLSTestCertAndKey)
      }

      Object.assign(options.requestOptions, {protocol: `${protocol}:`, socketPath: serverSet[serverName].address()})

      if (typeof engineConfig === 'object') {
        options = Object.assign({}, options, {engines: engineConfig.engines})
      }

      return Object.assign({}, sharedState, {requestParams: {expectedOK, url, options, state}})
    }

    async function cookieManagerTests () {
      const cookieManagerScope = [...nestedScope, 'cookie manager']
      const preparedCM = new jetta.CookieManager()

      await new Promise((resolve, reject) => preparedCM.on('ready', resolve))

      await uniformResultsExecutor(t, [...cookieManagerScope, 'prepared'], rParams(true, 'basic', null, {cookieManager: preparedCM}))

      const nonPreparedCookieManager = new jetta.CookieManager()

      await uniformResultsExecutor(t, [...cookieManagerScope, 'non-prepared'], rParams(true, 'basic', null, {cookieManager: nonPreparedCookieManager}))

      nonPreparedCookieManager.destroy()

      await uniformResultsExecutor(t, [...cookieManagerScope, 'invalid cookieManager'], rParams(false, 'basic', null, {cookieManager: {}}))

      const nonPreparedCookieManagerWithError = new jetta.CookieManager({
        publicSuffixOptions: {
          list: '',
          sources: ['not-a-url']
        }
      })

      await uniformResultsExecutor(t, [...cookieManagerScope, 'non-prepared w/ error'], rParams(false, 'basic', null, {cookieManager: nonPreparedCookieManagerWithError}))

      nonPreparedCookieManagerWithError.destroy()

      preparedCM.addCookie('a=a; Domain=localhost')

      const cookieManagerPreferredOverCookieHeaderResults = await uniformResultsExecutor(t, [...cookieManagerScope, 'cookie manager preferred over Cookie header'], rParams(true, 'cookieReflect', null, {cookieManager: preparedCM, requestOptions: {headers: {Cookie: 'a=b'}, pathname: '/'}}))

      t.equal(cookieManagerPreferredOverCookieHeaderResults.json.a, 'a', m(cookieManagerScope, `cookie manager should be preferred over Cookie header`))

      const cookieManagerPreferredOverCookieOptionResults = await uniformResultsExecutor(t, [...cookieManagerScope, 'cookie manager preferred over cookie option'], rParams(true, 'cookieReflect', null, {cookie: {a: 'c'}, cookieManager: preparedCM}))

      t.equal(cookieManagerPreferredOverCookieOptionResults.json.a, 'a', m(cookieManagerScope, `cookie manager should be preferred over cookie option`))

      preparedCM.cookies = {}

      preparedCM.addCookie('a=a; Domain=localhost; Secure')

      let secureProtocols = {[`${protocol}:`]: false}

      const cookieManagerSecureProtocolFalse = await uniformResultsExecutor(t, [...cookieManagerScope, 'cookie manager secure protocols = false'], rParams(true, 'cookieReflect', null, {cookieManager: preparedCM, secureProtocols}))

      t.deepEqual(cookieManagerSecureProtocolFalse.json, {}, m(cookieManagerScope, `Cookies set with Secure should not be sent when protocol is deemed insecure`))

      secureProtocols[`${protocol}:`] = true

      const cookieManagerSecureProtocolTrue = await uniformResultsExecutor(t, [...cookieManagerScope, 'cookie manager secure protocols = true'], rParams(true, 'cookieReflect', null, {cookieManager: preparedCM, secureProtocols}))

      t.equal(cookieManagerSecureProtocolTrue.json.a, 'a', m(cookieManagerScope, `Cookies set with Secure should be sent when protocol is deemed secure`))

      preparedCM.cookies = {}

      await uniformResultsExecutor(t, [...cookieManagerScope, 'Set-Cookie header response'], rParams(true, 'setCookie', null, {cookieManager: preparedCM, json: {a: 'some', b: 'values', c: 'here'}}))

      t.equal(preparedCM.getCookies().length, 3, m(cookieManagerScope, `Cookies should be set from Set-Cookie header`))

      await uniformResultsExecutor(t, [...cookieManagerScope, 'invalid Set-Cookie header response'], rParams(false, 'setCookieInvalid', null, {cookieManager: preparedCM}))

      preparedCM.destroy()
    }

    async function cookieOptionTests () {
      const cookieOptionScope = [...nestedScope, 'cookie option']

      const cookieOptionPreferredOverCookieHeaderResults = await uniformResultsExecutor(t, [...cookieOptionScope, 'cookie option preferred over Cookie header'], rParams(true, 'cookieReflect', null, {cookie: {a: 'c', b: 'b'}, requestOptions: {headers: {Cookie: 'a=b'}, pathname: '/'}}))

      t.equal(cookieOptionPreferredOverCookieHeaderResults.json.a, 'c', m(cookieOptionScope, `cookie option should be preferred over Cookie header`))
      t.equal(cookieOptionPreferredOverCookieHeaderResults.json.b, 'b', m(cookieOptionScope, `setting multiple cookies at once should be supported`))

      await uniformResultsExecutor(t, [...cookieOptionScope, 'cookie option invalid value'], rParams(false, 'cookieReflect', null, {cookie: {c: 'ø'}}))
    }

    async function requestBodyStreamTests () {
      const requestBodyStreamScope = [...nestedScope, 'requestBodyStream']

      const fileStream = fs.createReadStream(config.httpProtocols.readableStreamFilePath)

      const requestBodyStreamResults = await uniformResultsExecutor(t, requestBodyStreamScope, rParams(true, 'bodyReflect', null, {requestBodyStream: fileStream}))

      t.equal(requestBodyStreamResults.data.toString(), fs.readFileSync(config.httpProtocols.readableStreamFilePath).toString(), m(requestBodyStreamScope, `server should receive the correct request body from stream`))
      t.equal(requestBodyStreamResults.options.requestOptions.method, 'POST', m(requestBodyStreamScope, `method should be POST by default`))

      await uniformResultsExecutor(t, requestBodyStreamScope, rParams(true, 'bodyReflect', null, {
        requestBodyStream: fs.createReadStream(config.httpProtocols.readableStreamFilePath),
        requestOptions: {
          headers: {
            'Transfer-Encoding': 'chunked'
          }
        }
      }))

      await uniformResultsExecutor(t, [...requestBodyStreamScope, 'stream ended'], rParams(false, 'bodyReflect', null, {requestBodyStream: fileStream}))

      await uniformResultsExecutor(t, [...requestBodyStreamScope, 'stream error'], rParams(false, 'bodyReflect', null, {requestBodyStream: fs.createReadStream('')}))

      await uniformResultsExecutor(t, [...requestBodyStreamScope, 'invalid stream'], rParams(false, 'bodyReflect', null, {requestBodyStream: {}}))
    }

    async function contentEncodingTests () {
      const contentEncodingScope = [...nestedScope, 'content-encoding']
      const alloc = config.httpProtocols.contentEncodingAllocation
      const supportedEncodings = ['identity', 'deflate', 'gzip']
      let encodingCombinations = []

      for (let i = 0; i < supportedEncodings.length; i++) {
        encodingCombinations[encodingCombinations.length] = [supportedEncodings[i]]
        for (let j = 0; j < supportedEncodings.length; j++) {
          encodingCombinations[encodingCombinations.length] = [supportedEncodings[i], supportedEncodings[j]]
          for (let k = 0; k < supportedEncodings.length; k++) {
            encodingCombinations[encodingCombinations.length] = [supportedEncodings[i], supportedEncodings[j], supportedEncodings[k]]
          }
        }
      }

      for (let j = 0, jLen = encodingCombinations.length; j < jLen; j++) {
        const encodings = encodingCombinations[j]
        const nestedContentEncodingScope = [...contentEncodingScope, {encodings}]
        let options = {
          json: {alloc, encodings}
        }

        if (alloc > defaults.request.dataLimit) {
          options.dataLimit = alloc
        }

        const contentEncodingResults = await uniformResultsExecutor(t, nestedContentEncodingScope, rParams(true, 'encoding', null, options))

        t.equal(Buffer.compare(contentEncodingResults.data, Buffer.alloc(alloc)), 0, m(nestedContentEncodingScope, `decoded response should be valid`))

        options.checksum = {
          algorithm: 'sha384',
          digest: 'base64',
          expected: crypto.createHash('sha384').update(Buffer.alloc(alloc)).digest('base64')
        }

        await uniformResultsExecutor(t, [...nestedContentEncodingScope, 'checksum should be based on decoded response'], rParams(true, 'encoding', null, options))

        options.dataLimit = alloc - 1

        await uniformResultsExecutor(t, [...nestedContentEncodingScope, 'dataLimit (less than) alloc'], rParams(false, 'encoding', null, options))

        if (alloc > defaults.request.dataLimit) {
          options.dataLimit = alloc
        }

        options.requestOptions = {
          headers: {
            'Accepted-Encoding': 'unknown'
          }
        }

        await uniformResultsExecutor(t, [...nestedContentEncodingScope, 'encoded not accepted'], rParams(false, 'encoding', null, options))
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding'], rParams(false, 'encodingUnknown', null, {}))

      let acceptEncodingHeaderNull = {
        requestOptions: {
          headers: {
            'Accept-Encoding': null
          }
        }
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding - Accept-Encoding = null'], rParams(true, 'encodingUnknown', null, acceptEncodingHeaderNull))

      let acceptEncodingHeaderEmptyString = {
        requestOptions: {
          headers: {
            'Accept-Encoding': ''
          }
        }
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding - Accept-Encoding = empty string'], rParams(true, 'encodingUnknown', null, acceptEncodingHeaderEmptyString))

      let acceptedOptions = {
        requestOptions: {
          headers: {
            'Accept-Encoding': '*'
          }
        }
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding - accepted'], rParams(true, 'encodingUnknown', null, acceptedOptions))

      let acceptedQualityOptions = {
        requestOptions: {
          headers: {
            'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5'
          }
        }
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding - accepted w/ qualities'], rParams(true, 'encodingUnknown', null, acceptedQualityOptions))

      acceptedOptions.checksum = {
        algorithm: 'sha384',
        digest: 'base64'
      }

      await uniformResultsExecutor(t, [...contentEncodingScope, 'unknown encoding - accepted w/ checksum'], rParams(false, 'encodingUnknown', null, acceptedOptions))
    }

    async function redirectTests () {
      const redirectsScope = [...nestedScope, 'redirects']
      const redirectCodes = [301, 302, 307, 308]

      async function redirectExecutor (t, scope, p) {
        const results = await uniformResultsExecutor(t, scope, p)

        t.notEqual(results.redirects.length, 0, m([...scope, redirectExecutor.name], 'redirects should not be 0'))

        return results
      }

      for (let i = 0, len = redirectCodes.length; i < len; i++) {
        const redirectCode = redirectCodes[i]
        const nestedRedirectsScope = [...redirectsScope, redirectCode]
        let options = {
          json: {
            example: 'body'
          },
          requestOptions: {
            headers: {},
            pathname: `/${redirectCode}/${defaults.request.redirectLimit - 1}/${protocol}`
          }
        }

        const absoluteWithProtocolScope = [...nestedRedirectsScope, 'absolute redirect with protocol']
        const absoluteWithProtocolResults = await redirectExecutor(t, absoluteWithProtocolScope, rParams(true, 'redirectAbsolute', null, options))

        if (redirectCode === 307 || redirectCode === 308) {
          t.notEqual(absoluteWithProtocolResults.json.bodyLength, 0, m(absoluteWithProtocolScope, `body should be passed in redirect`))
        } else {
          t.equal(absoluteWithProtocolResults.json.bodyLength, 0, m(absoluteWithProtocolScope, `body should not be passed in redirect`))
        }

        options.requestOptions.pathname = `/${redirectCode}/${defaults.request.redirectLimit - 1}/`

        const absoluteNoProtocolScope = [...nestedRedirectsScope, 'absolute redirect without protocol']
        const absoluteNoProtocolResults = await redirectExecutor(t, absoluteNoProtocolScope, rParams(true, 'redirectAbsolute', null, options))

        if (redirectCode === 307 || redirectCode === 308) {
          t.notEqual(absoluteNoProtocolResults.json.bodyLength, 0, m(absoluteNoProtocolScope, `body should be passed in redirect`))
        } else {
          t.equal(absoluteNoProtocolResults.json.bodyLength, 0, m(absoluteNoProtocolScope, `body should not be passed in redirect`))
        }

        options.requestOptions.headers['x-jetta-test-redirect-relative-init'] = '1'

        for (let j = 0, jLen = config.httpProtocols.relativeRedirects.length; j < jLen; j++) {
          const relativeRedirect = config.httpProtocols.relativeRedirects[j]
          const relativeScope = [...nestedRedirectsScope, 'relative redirect', relativeRedirect.relative]

          options.json = Object.assign({}, relativeRedirect, {statusCode: redirectCode})
          options.requestOptions.pathname = relativeRedirect.from

          const relativeResults = await redirectExecutor(t, relativeScope, rParams(true, 'redirectRelative', null, options))

          if (redirectCode === 307 || redirectCode === 308) {
            t.notEqual(relativeResults.json.bodyLength, 0, m(relativeScope, `body should be passed in redirect`))
          } else {
            t.equal(relativeResults.json.bodyLength, 0, m(relativeScope, `body should not be passed in redirect`))
          }

          t.equal(relativeResults.url.parsedURL.pathname, relativeRedirect.expected, m(relativeScope, `relative redirect should be correct`))
        }

        options = {
          requestOptions: {
            headers: {},
            pathname: `/${redirectCode}/${defaults.request.redirectLimit - 1}/`
          }
        }

        options.form = {a: 'b'}

        const formRedirectScope = [...nestedRedirectsScope, 'redirect with options.form']
        const formRedirectResults = await redirectExecutor(t, formRedirectScope, rParams(true, 'redirectAbsolute', null, options))

        if (redirectCode === 307 || redirectCode === 308) {
          t.notEqual(formRedirectResults.json.bodyLength, 0, m(formRedirectScope, `body should be passed in redirect`))
        } else {
          t.equal(formRedirectResults.json.bodyLength, 0, m(formRedirectScope, `body should not be passed in redirect`))
        }

        options.form = null
        options.body = Buffer.alloc(10)

        const bodyRedirectScope = [...nestedRedirectsScope, 'redirect with options.body']
        const bodyRedirectResults = await redirectExecutor(t, bodyRedirectScope, rParams(true, 'redirectAbsolute', null, options))

        if (redirectCode === 307 || redirectCode === 308) {
          t.notEqual(bodyRedirectResults.json.bodyLength, 0, m(bodyRedirectScope, `body should be passed in redirect`))
        } else {
          t.equal(bodyRedirectResults.json.bodyLength, 0, m(bodyRedirectScope, `body should not be passed in redirect`))
        }

        options.body = null
        options.requestBodyStream = fs.createReadStream(config.httpProtocols.readableStreamFilePath)

        const requestBodyStreamRedirectScope = [...nestedRedirectsScope, 'redirect with options.requestBodyStream']

        if (redirectCode === 307 || redirectCode === 308) {
          await redirectExecutor(t, requestBodyStreamRedirectScope, rParams(false, 'redirectAbsolute', null, options))
        } else {
          await redirectExecutor(t, requestBodyStreamRedirectScope, rParams(true, 'redirectAbsolute', null, options))
        }

        options.requestBodyStream = null

        options = {
          cookie: {
            k: 'v'
          },
          redirectsPreserveHeader: {
            'x-jetta-test-redirect-header-preserve-always': jetta.request.constants.redirectsPreserveHeader.ALWAYS,
            'x-jetta-test-redirect-header-preserve-same-site': jetta.request.constants.redirectsPreserveHeader.SAMESITE,
            'x-jetta-test-redirect-header-preserve-never': jetta.request.constants.redirectsPreserveHeader.NEVER
          },
          requestOptions: {
            headers: {
              'x-jetta-test-redirect-header-preserve-always': '1',
              'x-jetta-test-redirect-header-preserve-same-site': '1',
              'x-jetta-test-redirect-header-preserve-never': '1'
            },
            pathname: `/${redirectCode}/init/`
          }
        }

        const redirectsPreserveHeaderLocalScope = [...nestedRedirectsScope, 'redirectsPreserveHeader - local']
        const redirectsPreserveHeaderLocalResults = await redirectExecutor(t, redirectsPreserveHeaderLocalScope, rParams(true, 'redirectHeaderReflect', null, options))

        t.equal(typeof redirectsPreserveHeaderLocalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-always'], 'string', m(redirectsPreserveHeaderLocalScope, `redirectsPreserveHeader.ALWAYS should work as expected`))
        t.equal(typeof redirectsPreserveHeaderLocalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-same-site'], 'string', m(redirectsPreserveHeaderLocalScope, `redirectsPreserveHeader.SAMESITE should work as expected`))
        t.notEqual(typeof redirectsPreserveHeaderLocalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-never'], 'string', m(redirectsPreserveHeaderLocalScope, `redirectsPreserveHeader.NEVER should work as expected`))

        t.true(typeof redirectsPreserveHeaderLocalResults.options.cookie === 'object' && redirectsPreserveHeaderLocalResults.options.cookie !== null, m(redirectsPreserveHeaderLocalScope, `cookies from cookie option should be retained on same-site redirects`))
        t.equal(typeof redirectsPreserveHeaderLocalResults.options.requestOptions.socketPath, 'string', m(redirectsPreserveHeaderLocalScope, `requestOptions.socketPath should be retained on same-site redirects`))

        options.requestOptions.pathname = `/${redirectCode}/init/${config.httpProtocols.externalRedirectURL}`

        const redirectsPreserveHeaderExternalScope = [...nestedRedirectsScope, 'redirectsPreserveHeader - external']
        const redirectsPreserveHeaderExternalResults = await redirectExecutor(t, redirectsPreserveHeaderExternalScope, rParams(true, 'redirectHeaderReflect', null, options))

        t.equal(typeof redirectsPreserveHeaderExternalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-always'], 'string', m(redirectsPreserveHeaderExternalScope, `redirectsPreserveHeader.ALWAYS should work as expected`))
        t.notEqual(typeof redirectsPreserveHeaderExternalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-same-site'], 'string', m(redirectsPreserveHeaderExternalScope, `redirectsPreserveHeader.SAMESITE should work as expected`))
        t.notEqual(typeof redirectsPreserveHeaderExternalResults.options.requestOptions.headers['x-jetta-test-redirect-header-preserve-never'], 'string', m(redirectsPreserveHeaderExternalScope, `redirectsPreserveHeader.NEVER should work as expected`))

        t.false(typeof redirectsPreserveHeaderExternalResults.options.cookie === 'object' && redirectsPreserveHeaderExternalResults.options.cookie !== null, m(redirectsPreserveHeaderExternalScope, `cookies from cookie option should be dropped on non-same-site redirects`))
        t.notEqual(typeof redirectsPreserveHeaderExternalResults.options.requestOptions.socketPath, 'string', m(redirectsPreserveHeaderExternalScope, `requestOptions.socketPath should be dropped on non-same-site redirects`))

        options = {
          redirectsPreserveHeader: {
            Authorization: jetta.request.constants.redirectsPreserveHeader.SAMESITE
          },
          requestOptions: {
            auth: config.httpProtocols.redirectAuthSamples.fromOriginalURLAuthOption,
            headers: {
              'Authorization': `Basic ${Buffer.from(config.httpProtocols.redirectAuthSamples.fromOriginalURLHeader).toString('base64')}`
            },
            pathname: `/${redirectCode}/init/provide-redirect-auth/`
          }
        }

        const redirectsAuthResolutionScope = [...nestedRedirectsScope, 'redirects Authorization resolution']
        const redirectsAuthResolutionFromURLScope = [...redirectsAuthResolutionScope, 'from redirect URL']
        const redirectsAuthResolutionFromURLResults = await redirectExecutor(t, redirectsAuthResolutionFromURLScope, rParams(true, 'redirectAuthorizationReflect', null, options))
        const redirectsAuthResolutionFromURLResultsValue = Buffer.from(redirectsAuthResolutionFromURLResults.json.headers.authorization.split(' ')[1], 'base64').toString()

        t.equal(redirectsAuthResolutionFromURLResultsValue, config.httpProtocols.redirectAuthSamples.fromRedirectURLAuthOption, m(redirectsAuthResolutionFromURLScope, `redirect should use authorization from redirect URL`))

        options.requestOptions.pathname = `/${redirectCode}/init/`

        const redirectsAuthResolutionFromOriginalHeaderScope = [...redirectsAuthResolutionScope, 'from original header']
        const redirectsAuthResolutionFromOriginalHeaderResults = await redirectExecutor(t, redirectsAuthResolutionFromOriginalHeaderScope, rParams(true, 'redirectAuthorizationReflect', null, options))
        const redirectsAuthResolutionFromOriginalHeaderResultsValue = Buffer.from(redirectsAuthResolutionFromOriginalHeaderResults.json.headers.authorization.split(' ')[1], 'base64').toString()

        t.equal(redirectsAuthResolutionFromOriginalHeaderResultsValue, config.httpProtocols.redirectAuthSamples.fromOriginalURLHeader, m(redirectsAuthResolutionFromOriginalHeaderScope, `redirect should use authorization from original header`))

        options.redirectsPreserveHeader.Authorization = jetta.request.constants.redirectsPreserveHeader.NEVER

        const redirectsAuthResolutionFromOriginalAuthOptionScope = [...redirectsAuthResolutionScope, 'from original auth option']
        const redirectsAuthResolutionFromOriginalAuthOptionResults = await redirectExecutor(t, redirectsAuthResolutionFromOriginalAuthOptionScope, rParams(true, 'redirectAuthorizationReflect', null, options))
        const redirectsAuthResolutionFromOriginalAuthOptionResultsValue = Buffer.from(redirectsAuthResolutionFromOriginalAuthOptionResults.json.headers.authorization.split(' ')[1], 'base64').toString()

        t.equal(redirectsAuthResolutionFromOriginalAuthOptionResultsValue, config.httpProtocols.redirectAuthSamples.fromOriginalURLAuthOption, m(redirectsAuthResolutionFromOriginalAuthOptionScope, `redirect should use authorization from original auth option`))

        options = {
          redirectsUpdateReferer: false,
          redirectsPreserveHeader: {
            Referer: jetta.request.constants.redirectsPreserveHeader.ALWAYS
          },
          requestOptions: {
            auth: config.httpProtocols.redirectAuthSamples.fromOriginalURLAuthOption,
            headers: {
              'Referer': `example.com`
            },
            pathname: `/${redirectCode}/1/`
          }
        }

        const redirectsUpdateRefererFalseWithPreserveHeaderScope = [...nestedRedirectsScope, 'redirectsUpdateReferer = false w/ redirectsPreserveHeader.ALWAYS']
        const redirectsUpdateRefererFalseWithPreserveHeaderResults = await redirectExecutor(t, redirectsUpdateRefererFalseWithPreserveHeaderScope, rParams(true, 'redirectAbsolute', null, options))

        t.notEqual(typeof redirectsUpdateRefererFalseWithPreserveHeaderResults.options.requestOptions.headers.Referer, 'string', m(redirectsUpdateRefererFalseWithPreserveHeaderScope, `Referer header should not be sent (localhost)`))

        delete options.redirectsPreserveHeader

        const redirectsUpdateRefererFalseWithoutPreserveHeaderScope = [...nestedRedirectsScope, 'redirectsUpdateReferer = false w/o redirectsPreserveHeader']
        const redirectsUpdateRefererFalseWithoutPreserveHeaderResults = await redirectExecutor(t, redirectsUpdateRefererFalseWithoutPreserveHeaderScope, rParams(true, 'redirectAbsolute', null, options))

        t.notEqual(typeof redirectsUpdateRefererFalseWithoutPreserveHeaderResults.options.requestOptions.headers.Referer, 'string', m(redirectsUpdateRefererFalseWithoutPreserveHeaderScope, `Referer header should not be sent (redirectsUpdateReferer = false)`))

        await redirectExecutor(t, [...nestedRedirectsScope, 'too many redirects'], rParams(false, 'redirectAbsolute', null, {
          requestOptions: {
            pathname: `/${redirectCode}/${defaults.request.redirectLimit + 1}/`
          }
        }))
      }
    }

    await uniformResultsExecutor(t, nestedScope, rParams(true, 'basic', null, {requestOptions: {method: 'get'}}))
    await uniformResultsExecutor(t, nestedScope, rParams(false, 'abort', null, {}))
    await uniformResultsExecutor(t, nestedScope, rParams(false, 'socketDestroy', null, {}))

    for (let i = 0, len = config.httpProtocols.badResponseCodes.length; i < len; i++) {
      const deepNestedScope = [...nestedScope, 'badResponseCodes']
      const statusCode = config.httpProtocols.badResponseCodes[i]
      const options = {
        requestOptions: {pathname: `${statusCode}`}
      }

      await uniformResultsExecutor(t, [...deepNestedScope, statusCode], rParams(false, 'responseCode', null, options))
    }

    await uniformResultsExecutor(t, [...nestedScope, 'prepare error'], rParams(false, 'basic', null, {
      requestOptions: {headers: {Accept: undefined}, pathname: '/'}
    }))

    await cookieManagerTests()
    await cookieOptionTests()

    const formScope = [...nestedScope, 'form']

    const formResults = await uniformResultsExecutor(t, formScope, rParams(true, 'formReflect', null, {form: config.httpProtocols.formExample}))

    t.deepEqual(formResults.json, config.httpProtocols.formExample, m(formScope, `server should receive the correct request body and header`))
    t.equal(formResults.options.requestOptions.method, 'POST', m(formScope, `method should be POST by default`))

    const jsonScope = [...nestedScope, 'json']

    const jsonResults = await uniformResultsExecutor(t, jsonScope, rParams(true, 'jsonReflect', null, {json: config.httpProtocols.jsonExample}))

    t.deepEqual(jsonResults.json, config.httpProtocols.jsonExample, m(jsonScope, `server should receive the correct request body and header`))
    t.equal(jsonResults.options.requestOptions.method, 'POST', m(jsonScope, `method should be POST by default`))

    const bodyScope = [...nestedScope, 'body']

    const bodyResults = await uniformResultsExecutor(t, bodyScope, rParams(true, 'bodyReflect', null, {body: config.httpProtocols.bodyExample}))

    t.deepEqual(bodyResults.data, config.httpProtocols.bodyExample, m(bodyScope, `server should receive the correct request body`))
    t.equal(jsonResults.options.requestOptions.method, 'POST', m(bodyScope, `method should be POST by default`))

    await requestBodyStreamTests()

    const agentsScope = [...nestedScope, 'agents']

    const agentsResults = await uniformResultsExecutor(t, agentsScope, rParams(true, 'basic', null, {agents: config.httpProtocols.agents, requestOptions: {agent: config.httpProtocols.agentsManual[`${protocol}:`]}}))

    t.true(agentsResults.options.requestOptions.agent.fromAgents, m(agentsScope, `request should prefer options.agents over options.requestOptions.agent`))

    await contentEncodingTests()
    await redirectTests()

    await uniformResultsExecutor(t, [...nestedScope, 'Content-Length over limit'], rParams(false, 'contentLength', null, {requestOptions: {pathname: `/${defaults.request.dataLimit + 1}/1`}}))

    await uniformResultsExecutor(t, [...nestedScope, 'invalid json response'], rParams(false, 'jsonInvalid', null, {}))
    await uniformResultsExecutor(t, [...nestedScope, 'timeout connect'], rParams(false, 'timeoutConnect', null, {timeLimit: 100}))
    await uniformResultsExecutor(t, [...nestedScope, 'timeout during response'], rParams(false, 'timeoutResponse', null, {timeLimit: 100}))

    await sharedOptionsTests(t, nestedScope, Object.assign({}, sharedState, {sharedOptionsParams, engineConfig}))
  }

  if (engineConfig === undefined || typeof engineConfig.engines['http:'] === 'function') {
    await protocolTest('http')
  }

  if (engineConfig === undefined || typeof engineConfig.engines['https:'] === 'function') {
    await protocolTest('https')
  }
}

module.exports = httpProtocolsTests
