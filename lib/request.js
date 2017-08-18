#! /usr/local/bin/node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const url = require('url')
const zlib = require('zlib')

const cookieLib = require('./cookie-lib')
const domainLib = require('./domain-lib')
const defaults = require('../data/defaults')
const JettaError = require('./jetta-error')
const urlParser = require('./url-parser')

function makeRequest (givenURL = null, options = {}, callback = () => {}, state = {redirectHistory: [], totalTime: Date.now()}) {
  const currentRequestStartTime = Date.now()

  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let results = {
    checksum: null,
    data: null,
    dataEncoding: null,
    error: null,
    json: null,
    lengths: {
      content: NaN,
      data: 0,
      decompressed: 0,
      response: 0
    },
    options: {
      checksum: {},
      engines: {},
      redirectsPreserveHeader: {},
      requestOptions: {
        headers: {}
      },
      secureProtocols: {},
      urlParser: {}
    },
    redirects: state.redirectHistory,
    responseHeaders: {},
    statusCode: NaN,
    time: {
      total: NaN,
      request: NaN,
      requestResponse: NaN
    },
    url: null
  }

  let callbackSent = false
  let dataTimeout = null
  let currentRequestRedirected = false
  let checksumGenerator = null
  let dataReceived = []
  let handledEndOfRequest = false
  let request = null
  let responseDecompressList = []
  let startResponseTime = 0
  let toFileStream = {closed: true}

  function setError (code, details) {
    const error = new JettaError(code, results.options.preferredErrorLanguage, details)

    if (results.error === null) {
      results.error = error
    }

    return results.error
  }

  function processResults () {
    if (toFileStream.closed !== true) {
      toFileStream.end()
      toFileStream.on('close', processResults)
      toFileStream.on('error', processResults)
      return
    }

    if (callbackSent === false && currentRequestRedirected === false) {
      callbackSent = true

      if (results.data !== null && typeof results.responseHeaders['content-type'] === 'string' && results.responseHeaders['content-type'].trim().toLowerCase().indexOf('application/json') === 0 && results.dataEncoding === null) {
        try {
          results.json = JSON.parse(results.data.toString())
        } catch (e) {
          setError('jetta-request-json-parse-error', e)
        }
      }

      results.time.total = Date.now() - state.totalTime

      process.nextTick(() => callback(results.error, results))
    }
  }

  function dataHandler (data) {
    if (results.error === null) {
      results.lengths.data += data.length

      if (checksumGenerator !== null) {
        checksumGenerator.update(data)
      }

      if (toFileStream.closed !== true) {
        toFileStream.write(data)
      }

      if (typeof results.options.onResponseData === 'function') {
        let onResponseResults = Object.assign({}, results)

        onResponseResults.time.total = Date.now() - state.totalTime

        results.options.onResponseData(data, onResponseResults)
      }

      if (results.options.storeDataInResults === true) {
        dataReceived[dataReceived.length] = data
      }
    }
  }

  function endRequestHandler () {
    clearTimeout(dataTimeout)

    if (handledEndOfRequest === true) {
      return
    }

    const statusCodeCat = Number(`${results.statusCode}`[0])

    handledEndOfRequest = true
    results.time.request = Date.now() - currentRequestStartTime
    results.time.requestResponse = Date.now() - startResponseTime

    if (Number.isSafeInteger(results.lengths.data) === true && results.options.storeDataInResults === true) {
      results.data = Buffer.concat(dataReceived, results.lengths.data)
    }

    if (checksumGenerator !== null) {
      results.checksum = checksumGenerator.digest(results.options.checksum.digest)

      if (Buffer.isBuffer(results.checksum) === true) {
        results.checksum = null
        setError('jetta-request-invalid-checksum-digest', {digest: results.options.checksum.digest})
      }
    }

    if (statusCodeCat === 3 && typeof results.responseHeaders.location === 'string') {
      if (results.options.redirectLimit > results.redirects.length) {
        const currentHeaderKeys = Object.keys(results.options.requestOptions.headers)
        const redirectURL = urlParser(url.resolve(results.url.url, results.responseHeaders.location), results.options.urlParser)
        const isSameSiteRedirect = domainLib.domainInOtherDomain(redirectURL.parsedURL.hostname, results.url.parsedURL.hostname)
        const secureToNonSecureProtocol = results.options.secureProtocols[results.url.parsedURL.protocol] === true && results.options.secureProtocols[redirectURL.parsedURL.protocol] !== true

        let redirectOptions = Object.assign({}, results.options, {requestOptions: {}})

        Object.assign(redirectOptions.requestOptions, results.options.requestOptions, {auth: null, headers: {}})

        if (isSameSiteRedirect === false) {
          redirectOptions.cookie = null
          redirectOptions.requestOptions.auth = null
          redirectOptions.requestOptions.socketPath = null
        }

        if (results.statusCode !== 307 && results.statusCode !== 308) {
          Object.assign(redirectOptions, {body: null, form: null, json: null, requestBodyStream: null})
        }

        Object.assign(redirectOptions.requestOptions, redirectURL.parsedURL, {headers: {}})

        for (let i = 0, len = currentHeaderKeys.length; i < len; i++) {
          const name = currentHeaderKeys[i]
          const value = results.options.requestOptions.headers[name]

          if (redirectOptions.redirectsPreserveHeader[name] === makeRequest.constants.redirectsPreserveHeader.ALWAYS) {
            redirectOptions.requestOptions.headers[name] = value
          } else if (redirectOptions.redirectsPreserveHeader[name] === makeRequest.constants.redirectsPreserveHeader.SAMESITE && isSameSiteRedirect === true) {
            redirectOptions.requestOptions.headers[name] = value
          } else {
            continue
          }
        }

        if (typeof redirectURL.parsedURL.auth === 'string' && redirectURL.parsedURL.auth !== results.options.requestOptions.auth) {
          delete redirectOptions.requestOptions.headers.Authorization
        } else if (typeof redirectOptions.requestOptions.headers.Authorization === 'string') {
          Object.assign(redirectOptions.requestOptions, {auth: null})
        } else if (typeof results.options.requestOptions.auth === 'string' && isSameSiteRedirect === true) {
          Object.assign(redirectOptions.requestOptions, {auth: results.options.requestOptions.auth})
        } else {
          Object.assign(redirectOptions.requestOptions, {auth: null})
        }

        if (redirectOptions.redirectsUpdateReferer === true) {
          const referURL = Object.assign({}, results.url.parsedURL, {auth: null, hash: null})
          redirectOptions.requestOptions.headers.Referer = urlParser(referURL, redirectOptions.urlParser).url
        }

        if (results.url.isLocalhost === true || results.url.parsedURL.protocol === 'data:' || results.url.parsedURL.protocol === 'file:' || secureToNonSecureProtocol === true) {
          delete redirectOptions.requestOptions.headers.Referer
        }

        state.redirectHistory[state.redirectHistory.length] = results

        currentRequestRedirected = true

        makeRequest(null, redirectOptions, callback, state)
      } else {
        setError('jetta-request-too-many-redirects')
      }
    } else if (Number.isSafeInteger(results.statusCode) === true && statusCodeCat !== 2) {
      setError('jetta-request-bad-response-code')
    } else if (typeof results.options.checksum.expected === 'string' && results.checksum !== results.options.checksum.expected) {
      setError('jetta-request-checksum-verification-failed')
    }

    processResults()
  }

  function handleDataProtocol () {
    startResponseTime = Date.now()

    const dataWithoutProtocol = results.url.url.slice('data:'.length).replace(/^\/*/g, '')
    const dataSplit = dataWithoutProtocol.split(',')
    let data = null
    let isBase64Encoded = false
    let mediaType = ''

    if (dataSplit.length < 2) {
      setError('jetta-request-invalid-value-for-data-protocol')
      return processResults()
    }

    if (/;base64$/.test(dataSplit[0])) {
      isBase64Encoded = true
      mediaType = dataSplit[0].slice(0, -';base64'.length)
    } else {
      mediaType = dataSplit[0]
    }

    if (mediaType !== '') {
      if (mediaType[0] === ';') {
        results.responseHeaders['content-type'] = `text/plain${mediaType}`
      } else {
        results.responseHeaders['content-type'] = mediaType
      }
    } else {
      results.responseHeaders['content-type'] = 'text/plain;charset=US-ASCII'
    }

    if (isBase64Encoded === true) {
      data = Buffer.from(dataSplit.slice(1).join(','), 'base64')
    } else {
      try {
        data = decodeURIComponent(dataSplit.slice(1).join(','))
      } catch (e) {
        setError('jetta-request-url-decode-uri-component-error', e)
        return processResults()
      }

      data = Buffer.from(data)
    }

    results.lengths.response = data.length

    if (results.lengths.response > results.options.dataLimit) {
      setError('jetta-request-exceeded-data-limit-actual')
      return processResults()
    }

    dataHandler(data)
    endRequestHandler()
  }

  function handleFileProtocol () {
    startResponseTime = Date.now()

    let filePath = null
    let fileSize = 0

    try {
      filePath = new url.URL(results.url.url)
    } catch (e) {
      setError('jetta-request-invalid-file-url', e)
      return processResults()
    }

    try {
      fileSize = fs.statSync(filePath).size
    } catch (e) {
      setError('jetta-request-file-stat-error', e)
      return processResults()
    }

    if (fileSize > results.options.dataLimit) {
      setError('jetta-request-exceeded-data-limit-actual')
      return processResults()
    }

    const readFileStream = fs.createReadStream(filePath)

    readFileStream.on('data', (data) => {
      results.lengths.response += data.length

      dataHandler(data)
    })

    readFileStream.on('end', endRequestHandler)
    readFileStream.on('error', (error) => {
      setError('jetta-request-file-read-error', error)
      return processResults()
    })
  }

  function handleResponse (response) {
    startResponseTime = Date.now()

    results.responseHeaders = response.headers
    results.statusCode = response.statusCode

    const prelimContentLength = Number(results.responseHeaders['content-length'])

    if (Number.isSafeInteger(prelimContentLength)) {
      results.lengths.content = prelimContentLength
    }

    if (results.lengths.content > results.options.dataLimit) {
      setError('jetta-request-exceeded-data-limit-content-length')
      return request.abort()
    }

    if (results.options.cookieManager !== null && results.responseHeaders['set-cookie'] instanceof Array) {
      const optionsForAddCookie = {
        isSecureEnv: results.options.secureProtocols[results.url.parsedURL.protocol] === true,
        preferredErrorLanguage: results.options.preferredErrorLanguage,
        requestMethod: results.options.requestOptions.method,
        requestURL: results.url.url
      }

      for (let i = 0, len = results.responseHeaders['set-cookie'].length; i < len; i++) {
        try {
          results.options.cookieManager.addCookie(results.responseHeaders['set-cookie'][i], optionsForAddCookie)
        } catch (e) {
          setError('jetta-request-error-setting-cookie', e)
          return request.abort()
        }
      }
    }

    if (typeof results.responseHeaders['content-encoding'] === 'string') {
      const contentEncodingList = results.responseHeaders['content-encoding'].split(/, */)
      let acceptedEncodings = null
      let localResponseDecompressList = []

      if (typeof results.options.requestOptions.headers['Accept-Encoding'] === 'string') {
        const trimmedAcceptEncoding = results.options.requestOptions.headers['Accept-Encoding'].trim()

        if (trimmedAcceptEncoding !== '') {
          const acceptEncodingList = trimmedAcceptEncoding.split(/, */)

          acceptedEncodings = {}

          for (let i = 0, len = acceptEncodingList.length; i < len; i++) {
            const encoding = acceptEncodingList[i].split(';')[0].trim()

            if (encoding === '*') {
              acceptedEncodings = null
              break
            } else {
              acceptedEncodings[encoding] = true
            }
          }
        }
      }

      for (let i = 0, len = contentEncodingList.length; i < len; i++) {
        const trimmedContentEncoding = contentEncodingList[i].trim()

        if (trimmedContentEncoding === 'identity' || trimmedContentEncoding === '') {
          continue
        }

        if (acceptedEncodings !== null && acceptedEncodings[trimmedContentEncoding] !== true) {
          setError('jetta-request-encoding-not-allowed', {encoding: trimmedContentEncoding})
          return request.abort()
        }

        if (trimmedContentEncoding === 'deflate') {
          localResponseDecompressList[localResponseDecompressList.length] = zlib.createInflate({finishFlush: zlib.constants.Z_SYNC_FLUSH})
        } else if (trimmedContentEncoding === 'gzip') {
          localResponseDecompressList[localResponseDecompressList.length] = zlib.createGunzip({finishFlush: zlib.constants.Z_SYNC_FLUSH})
        } else {
          results.dataEncoding = contentEncodingList
          localResponseDecompressList = []
          break
        }
      }

      localResponseDecompressList.reverse()

      for (let i = 0, len = localResponseDecompressList.length; i < len; i++) {
        const nextDecompressor = localResponseDecompressList[i + 1]

        localResponseDecompressList[i].on('data', (data) => {
          if ((results.lengths.decompressed + data.length) > results.options.dataLimit) {
            localResponseDecompressList[i].emit('error', setError('jetta-request-decompressed-data-limit'))
            return request.abort()
          }

          if (typeof nextDecompressor === 'object') {
            nextDecompressor.write(data)
          } else {
            results.lengths.decompressed += data.length
            dataHandler(data)
          }
        })

        localResponseDecompressList[i].on('end', () => {
          if (typeof nextDecompressor === 'object') {
            nextDecompressor.flush(() => nextDecompressor.end())
          } else {
            endRequestHandler()
          }
        })

        localResponseDecompressList[i].on('error', (error) => {
          setError('jetta-request-decompress-failed', error)

          endRequestHandler()
        })
      }

      responseDecompressList = localResponseDecompressList
    }

    if (checksumGenerator !== null && results.dataEncoding !== null) {
      setError('jetta-request-checksum-on-encoded-data')
      return request.abort()
    }

    response.on('data', (data) => {
      clearTimeout(dataTimeout)
      results.lengths.response += data.length

      if (results.lengths.response > results.options.dataLimit) {
        setError('jetta-request-exceeded-data-limit-actual')
        return request.abort()
      } else if (responseDecompressList.length !== 0) {
        responseDecompressList[0].write(data)
      } else {
        dataHandler(data)
      }

      dataTimeout = setTimeout(() => {
        setError('jetta-request-response-timed-out-during')
        request.abort()
      }, results.options.timeLimit)
    })

    response.on('end', () => {
      if (responseDecompressList.length !== 0) {
        responseDecompressList[0].flush(() => responseDecompressList[0].end())
      } else {
        endRequestHandler()
      }
    })

    response.on('aborted', () => {
      setError('jetta-request-response-aborted')
      endRequestHandler()
    })

    response.on('error', (error) => {
      setError('jetta-request-response-error', error)
      processResults()
    })
  }

  function waitForCookieManager () {
    const CookieManagerReady = () => {
      results.options.cookieManager.removeListener('error', CookieManagerError)
      currentRequestRedirected = true

      makeRequest(givenURL, options, callback, state)
    }

    const CookieManagerError = (error) => {
      results.options.cookieManager.removeListener('ready', CookieManagerReady)
      setError('jetta-request-cookie-manager-setup-error', error)
      processResults()
    }

    results.options.cookieManager.once('ready', CookieManagerReady)
    results.options.cookieManager.once('error', CookieManagerError)
  }

  Object.assign(results.options, defaults.request, options)

  results.options.checksum = {}
  results.options.engines = {}
  results.options.redirectsPreserveHeader = {}
  results.options.requestOptions = {headers: {}}
  results.options.secureProtocols = {}
  results.options.urlParser = {}

  Object.assign(results.options.checksum, defaults.request.checksum, options.checksum)
  Object.assign(results.options.engines, defaults.request.engines, options.engines)
  Object.assign(results.options.redirectsPreserveHeader, defaults.request.redirectsPreserveHeader, options.redirectsPreserveHeader)
  Object.assign(results.options.requestOptions, defaults.request.requestOptions, options.requestOptions, {headers: {}})
  Object.assign(results.options.requestOptions.headers, defaults.request.requestOptions.headers, options.requestOptions ? options.requestOptions.headers : {})
  Object.assign(results.options.secureProtocols, defaults.request.secureProtocols, options.secureProtocols)
  Object.assign(results.options.urlParser, defaults.request.urlParser, options.urlParser)

  if (givenURL !== null) {
    results.url = urlParser(givenURL, results.options.urlParser)

    if (results.url.isValid === false) {
      setError('jetta-request-invalid-url', results.url)
      return processResults()
    }
  } else {
    if (results.options.requestOptions.socketPath !== null) {
      const socketPathURL = Object.assign({}, results.options.requestOptions, {host: 'localhost', hostname: 'localhost', port: null})

      results.url = urlParser(socketPathURL, results.options.urlParser)
    } else {
      results.url = urlParser(results.options.requestOptions, results.options.urlParser)
    }

    if (results.url.isValid === false) {
      setError('jetta-request-invalid-url', results.url)
      return processResults()
    }
  }

  Object.assign(results.options.requestOptions, results.url.parsedURL)

  if (results.options.requestOptions.socketPath !== null) {
    results.options.requestOptions.host = null
    results.options.requestOptions.hostname = null
    results.options.requestOptions.port = null
  }

  if (results.options.cookieManager !== null && results.options.cookieManager.ready === false) {
    return waitForCookieManager()
  }

  if (typeof results.options.toFile === 'string' || results.options.toFile instanceof url.URL) {
    toFileStream = fs.createWriteStream(results.options.toFile)
    toFileStream.on('error', (error) => {
      setError('jetta-request-write-file-stream-error', error)
      toFileStream.closed = true
    })
  }

  if (typeof results.options.form === 'object' && results.options.form !== null) {
    results.options.requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    results.options.body = querystring.stringify(results.options.form)
  }

  if (typeof results.options.json === 'object' && results.options.json !== null) {
    results.options.requestOptions.headers['Content-Type'] = 'application/json'
    results.options.body = JSON.stringify(results.options.json)
  }

  if (typeof results.options.body === 'string' || Buffer.isBuffer(results.options.body) === true) {
    results.options.body = results.options.body
  }

  if (results.options.body && typeof results.options.requestOptions.headers['Content-Length'] !== 'string') {
    results.options.requestOptions.headers['Content-Length'] = Buffer.byteLength(results.options.body)
  }

  if (results.options.requestBodyStream !== null) {
    if (typeof results.options.requestOptions.headers['Transfer-Encoding'] !== 'string') {
      results.options.requestOptions.headers['Transfer-Encoding'] = 'chunked'
    }

    if (results.options.requestBodyStream.readable !== true) {
      setError('jetta-request-stream-not-readable')
      return processResults()
    }
  }

  if (typeof results.options.checksum.algorithm === 'string') {
    try {
      checksumGenerator = crypto.createHash(results.options.checksum.algorithm)
    } catch (e) {
      setError('jetta-request-invalid-checksum-algorithm', {algorithm: options.checksum.algorithm, e})
      return processResults()
    }
  }

  if (typeof results.options.requestOptions.method === 'string') {
    results.options.requestOptions.method = results.options.requestOptions.method.toUpperCase()
  } else if (results.options.requestBodyStream !== null || results.options.body !== null) {
    results.options.requestOptions.method = 'POST'
  } else {
    results.options.requestOptions.method = 'GET'
  }

  if (results.options.cookie !== null) {
    try {
      results.options.requestOptions.headers['Cookie'] = cookieLib.stringifyCookieKV(results.options.cookie)
    } catch (e) {
      setError('jetta-request-error-processing-cookie-header', e)
      return processResults()
    }
  }

  if (results.options.cookieManager !== null) {
    const optionsForGenerateCookieHeader = {
      isSecureEnv: results.options.secureProtocols[results.url.parsedURL.protocol] === true,
      preferredErrorLanguage: results.options.preferredErrorLanguage,
      requestMethod: results.options.requestOptions.method,
      requestURL: results.url.url
    }
    let cookieHeaderValue = ''

    try {
      cookieHeaderValue = results.options.cookieManager.generateCookieHeader({hostname: results.url.parsedURL.hostname, pathname: results.url.parsedURL.pathname}, optionsForGenerateCookieHeader)
    } catch (e) {
      setError('jetta-request-error-processing-cookie-header', e)
      return processResults()
    }

    if (cookieHeaderValue !== '') {
      results.options.requestOptions.headers['Cookie'] = cookieHeaderValue
    }
  }

  if (typeof results.options.agents === 'object' && results.options.agents !== null && typeof results.options.agents[results.options.requestOptions.protocol] === 'object') {
    results.options.requestOptions.agent = results.options.agents[results.options.requestOptions.protocol]
  }

  if (typeof results.options.engines[results.options.requestOptions.protocol] === 'function') {
    try {
      request = results.options.engines[results.options.requestOptions.protocol](results.options.requestOptions)
    } catch (e) {
      setError('jetta-request-prepare-fail', e)
      return processResults()
    }
  } else if (results.url.parsedURL.protocol === 'data:') {
    handleDataProtocol()
  } else if (results.url.parsedURL.protocol === 'file:') {
    handleFileProtocol()
  } else if (results.options.requestOptions.protocol === 'https:') {
    try {
      request = https.request(results.options.requestOptions)
    } catch (e) {
      setError('jetta-request-prepare-fail', e)
      return processResults()
    }
  } else if (results.options.requestOptions.protocol === 'http:') {
    try {
      request = http.request(results.options.requestOptions)
    } catch (e) {
      setError('jetta-request-prepare-fail', e)
      return processResults()
    }
  } else {
    setError('jetta-request-unsupported-protocol', {protocol: results.options.requestOptions.protocol})
    return processResults()
  }

  if (request === null) return

  request.on('abort', () => {
    setError('jetta-request-client-aborted')
    processResults()
  })

  request.on('aborted', () => {
    setError('jetta-request-server-aborted')
    processResults()
  })

  request.on('error', (error) => {
    setError('jetta-request-error', error)
    processResults()
  })

  request.on('response', handleResponse)

  request.setTimeout(results.options.timeLimit, () => {
    setError('jetta-request-timed-out-initial')
    request.abort()
  })

  if (results.options.requestBodyStream !== null) {
    results.options.requestBodyStream.on('error', (error) => {
      setError('jetta-request-stream-error', error)
      request.abort()
    })

    results.options.requestBodyStream.pipe(request)
  } else {
    if (results.options.body !== null) {
      request.write(results.options.body)
    }

    request.end()
  }
}

function makeRequestPromise (givenURL = null, options = {}) {
  return new Promise((resolve, reject) => {
    makeRequest(givenURL, options, (error, results) => {
      if (error !== null) {
        error.results = results
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

makeRequest.constants = {
  redirectsPreserveHeader: {
    get NEVER () { return 0 },
    set NEVER (v) {},
    get ALWAYS () { return 1 },
    set ALWAYS (v) {},
    get SAMESITE () { return 2 },
    set SAMESITE (v) {}
  }
}

makeRequestPromise.constants = makeRequest.constants

module.exports = {
  makeRequest,
  makeRequestPromise
}
