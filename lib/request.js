#! /usr/local/bin/node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const querystring = require('querystring')
const stream = require('stream')
const url = require('url')
const zlib = require('zlib')

const defaults = require('../data/defaults')
const JettaError = require('./error')
const ProgressLogger = require('./progress-logger')
const urlParser = require('./url-parser')

// NOTE: mention use cookieManager or cookie header (created via cookie manager) to set cookies
  // NOTE: no more 'options.cookie' - doesn't really make since (as in how to handle for requests, public suffix domains, security, etc.) setup cookieManager.
  // NOTE: You can immediately use requests - the request will wait for the cookieManager to setup
// NOTE: toFile (full or partial path) uses last request and will overwrite an existing file
  // NOTE: streams the file - no worries on memory usage
  // NOTE: the response will also return the data as usual, unless onResponseData is defined
    // NOTE: if you don't want results.data at all, simply set `onResponseData` to `() => {}`

// TEST: actual data recieved should not raise an error with decompress being higher
// TEST: Internationalized Domain Name (IDN)
// TEST: Handles Data URI scheme (`data:`)
// TEST: Handles File URI scheme (`file:`)
  // TEST: localhost or no host

function makeRequest (givenURL = null, options = {}, callback = () => {}, currentRedirects = 0) {
  const startTotalTime = Date.now()

  if (typeof options === 'function') {
    currentRedirects = callback
    callback = options
    options = {}
  }

  let results = {
    checksum: null,
    contentLength: null,
    contentEncoding: null,
    data: null,
    dataLength: 0,
    dataResponseLength: 0,
    error: null,
    options: null,
    redirects: 0,
    responseHeaders: {},
    statusCode: NaN,
    time: null,
    url: null
  }

  let callbackSent = false
  let dataTimeout = null
  let currentRequestRedirected = false
  let checksumGenerator = null
  let dataRecieved = []
  let progressLoggerName = 'jetta request'
  let request = null
  let requestInProgress = false
  let responseDecompressing = 0
  let responseDecompressor = null
  let responseEnded = false
  let startResponseTime = 0
  let writeFileStream = null

  function processResults () {
    if (callbackSent === false && currentRequestRedirected === false) {
      callbackSent = true

      callback(results.error, results)
    }
  }

  function setError (code = '', details = null) {
    if (results.error === null) {
      results.error = new JettaError(code, results.options.preferredErrorLanguage, details)
    }
  }

  function dataHandler (data = Buffer.from([])) {
    results.dataLength += data.length

    if (writeFileStream !== null && writeFileStream.closed !== true) {
      writeFileStream.write(data)
    }

    if (typeof results.options.onResponseData === 'function') {
      results.options.onResponseData(data, results)
    } else {
      dataRecieved[dataRecieved.length] = data
    }
  }

  function endRequestHandler () {
    clearTimeout(dataTimeout)
    results.time = {
      total: Date.now() - startTotalTime,
      response: Date.now() - startResponseTime
    }

    requestInProgress = false

    if (writeFileStream !== null && writeFileStream.closed !== true) {
      writeFileStream.end()
    }

    if (results.dataLength !== 0 && typeof results.options.onResponseData !== 'function') {
      results.data = Buffer.concat(dataRecieved, results.dataLength)
    }

    if (checksumGenerator !== null) {
      results.checksum = checksumGenerator.digest(results.options.checksum.digest)
    }

    if (results.statusCode >= 300 && results.statusCode <= 399 && typeof results.responseHeaders.location === 'string') {
      if (results.options.redirectLimit > results.redirects) {
        let redirectURL = urlParser(url.resolve(results.url.url, results.responseHeaders.location), results.options.urlParser)

        currentRequestRedirected = true

        if (typeof results.options.requestOptions.headers === 'object' && results.options.requestOptions.headers !== null && typeof results.options.requestOptions.headers.Referer !== 'undefined') {
          delete results.options.requestOptions.headers.Referer
        }

        if (typeof results.options.headers.Referer !== 'undefined') {
          delete results.options.headers.Referer
        }

        if (results.options.redirectsUpdateReferer === true) {
          if (results.url.isLocalhost === false && results.url.parsedURL.protocol !== 'data:' && results.url.parsedURL.protocol !== 'file:' && (results.url.parsedURL.protocol === 'https:' && redirectURL.parsedURL.protocol === 'http:') === false) {
            // TEST: not if from "file", from "data" URI, from HTTPS -> HTTP
            redirectURL.parsedURL.auth = null
            redirectURL.parsedURL.hash = null
          }
        }

        makeRequest(redirectURL.parsedURL, results.options, callback, results.redirects + 1)
      } else {
        setError('jetta-request-too-many-redirects')
      }
    } else if (results.statusCode > 299) {
      setError('jetta-request-bad-response-code')
    } else if (typeof results.options.checksum.verify === 'string' && results.checksum !== results.options.checksum.verify) {
      setError('jetta-request-checksum-verification-failed')
    }

    responseDecompressor = null

    processResults()
  }

  function handleDataProtocol () {
    progressLoggerName = '`data:` request'
    startResponseTime = Date.now()

    const dataWithoutProtocol = results.url.url.slice('data:'.length).replace(/^\/*/g, '')
    const dataSplit = dataWithoutProtocol.split(',')
    let data = null
    let isBase64Encoded = false
    let mediaType = ''

    if (dataSplit.pieces < 2) {
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
      results.responseHeaders['Content-Type'] = mediaType
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

    results.dataResponseLength = data.length

    if (results.dataResponseLength > results.options.dataLimit) {
      setError('jetta-request-exceeded-data-limit-actual')
      return processResults()
    }

    if (results.options.progressLog !== null) {
      let logData = {
        current: results.dataResponseLength,
        total: results.dataResponseLength,
        name: progressLoggerName
      }

      results.options.progressLog.log(logData)
    }

    if (checksumGenerator !== null) {
      checksumGenerator.update(data)
    }

    dataHandler(data)
    endRequestHandler()
  }

  function handleFileProtocol () {
    progressLoggerName = '`file:` request'
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
      results.dataResponseLength += data.length

      if (results.options.progressLog !== null) {
        let logData = {
          current: results.dataResponseLength,
          total: fileSize,
          name: progressLoggerName
        }

        results.options.progressLog.log(logData)
      }

      if (checksumGenerator !== null) {
        checksumGenerator.update(data)
      }

      dataHandler(data)
    })

    readFileStream.on('end', () => {
      if (results.error === null) {
        endRequestHandler()
      }
    })

    readFileStream.on('error', (error) => {
      setError('jetta-request-file-read-error', error)
      return processResults()
    })
  }

  function handleResponse (response = {}) {
    startResponseTime = Date.now()

    results.responseHeaders = response.headers
    results.statusCode = response.statusCode

    const prelimContentLength = Number(results.responseHeaders['content-length'])

    if (Number.isSafeInteger(prelimContentLength)) {
      results.contentLength = prelimContentLength
    }

    if (results.options.cookieManager !== null && results.responseHeaders['set-cookie'] instanceof Array) {
      let optionsForAddCookie = {
        isSecureEnv: false,
        preferredErrorLanguage: results.options.preferredErrorLanguage,
        requestMethod: results.options.requestOptions.method,
        requestURL: results.url.url
      }

      if (results.options.secureProtocols !== null && results.options.secureProtocols[results.url.parsedURL.protocol] === true) {
        optionsForAddCookie.isSecureEnv = true
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

    if (results.contentLength > results.options.dataLimit) {
      setError('jetta-request-exceeded-data-limit-content-length')
      return request.abort()
    }

    if (typeof results.responseHeaders['content-encoding'] === 'string' && results.responseHeaders['content-encoding'] !== '') {
      if (results.options.decompressResponseIfPossible === true) {
        switch (results.responseHeaders['content-encoding']) {
          case 'gzip':
            responseDecompressor = zlib.createGunzip()
            break
          case 'deflate':
            responseDecompressor = zlib.createInflate()
            break
          default:
            results.contentEncoding = results.responseHeaders['content-encoding']
        }
      } else {
        results.contentEncoding = results.responseHeaders['content-encoding']
      }
    }

    if (responseDecompressor !== null) {
      responseDecompressor.on('data', (data) => {
        dataHandler(data)

        if (responseEnded === true && responseDecompressing === 0 && results.error === null) {
          endRequestHandler()
        }
      })

      responseDecompressor.on('end', () => {
        if (responseEnded === true && responseDecompressing === 0 && results.error === null) {
          endRequestHandler()
        }
      })

      responseDecompressor.on('error', (error) => {
        setError('jetta-request-decompress-failed', error)
        request.abort()
      })
    }

    response.on('data', (data) => {
      clearTimeout(dataTimeout)
      results.dataResponseLength += data.length

      if (results.options.progressLog !== null) {
        let logData = {
          current: results.dataResponseLength,
          total: results.contentLength,
          name: progressLoggerName
        }

        results.options.progressLog.log(logData)
      }

      if (checksumGenerator !== null) {
        checksumGenerator.update(data)
      }

      if (results.dataResponseLength > results.options.dataLimit) {
        setError('jetta-request-exceeded-data-limit-actual')
        return request.abort()
      } else if (Number.isSafeInteger(results.contentLength) && results.dataResponseLength > results.contentLength) {
        setError('jetta-request-response-exceeded-content-length')
        return request.abort()
      } else if (responseDecompressor !== null) {
        responseDecompressing++
        responseDecompressor.write(data, () => {
          responseDecompressing--
        })
      } else {
        dataHandler(data)
      }

      dataTimeout = setTimeout(() => {
        setError('jetta-request-response-timed-out-during')
        request.abort()
      }, results.options.timeLimit)
    })

    response.on('end', () => {
      responseEnded = true

      if (responseDecompressor !== null) {
        responseDecompressor.end()
      }

      if (responseDecompressor === null && results.error === null) {
        endRequestHandler()
      }
    })

    response.on('aborted', () => {
      processResults()
    })

    response.on('error', (error) => {
      setError('jetta-request-response-error', error)
      processResults()
    })
  }

  function waitForCookieManager () {
    const CookieManagerReady = () => {
      results.options.cookieManager.removeListener('error', CookieManagerError)
      makeRequest(givenURL, options, callback, currentRedirects)
    }

    const CookieManagerError = (error) => {
      results.options.cookieManager.removeListener('ready', CookieManagerReady)
      setError('jetta-request-cookie-manager-setup-error', error)
      processResults()
    }

    results.options.cookieManager.once('ready', CookieManagerReady)
    results.options.cookieManager.once('error', CookieManagerError)
  }

  results.options = Object.assign({}, defaults.request, options)
  results.options.checksum = Object.assign({}, defaults.request.checksum, options.checksum)
  results.options.engine = Object.assign({}, defaults.request.engine, options.engine)
  results.options.headers = Object.assign({}, defaults.request.headers, options.requestOptions ? options.requestOptions.headers : null, options.headers)
  results.options.requestOptions = Object.assign({}, defaults.request.requestOptions, options.requestOptions)
  results.options.urlParser = Object.assign({}, defaults.request.urlParser, options.urlParser)

  if (results.options.cookieManager !== null && results.options.cookieManager.ready === false) {
    waitForCookieManager()
  }

  if (typeof results.options.toFile === 'string') {
    writeFileStream = fs.createWriteStream(path._makeLong(results.options.toFile))
    writeFileStream.on('error', (error) => {
      setError('jetta-request-write-file-stream-error', error)
      if (requestInProgress === true) {
        request.abort()
      }
    })
  }

  if (typeof results.options.form === 'object' && results.options.form !== null) {
    results.options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    results.options.body = querystring.stringify(results.options.form)
  }

  if (typeof results.options.json === 'object' && results.options.json !== null) {
    results.options.headers['Content-Type'] = 'application/json'
    results.options.body = JSON.stringify(results.options.json)
  }

  if (typeof results.options.body === 'string' || Buffer.isBuffer(results.options.body) === true) {
    results.options.body = results.options.body
  }

  if (results.options.body && typeof results.options.headers['Content-Length'] !== 'number') {
    results.options.headers['Content-Length'] = Buffer.byteLength(results.options.body)
  }

  if (results.options.requestBodyStream instanceof stream) {
    results.options.body = null
    results.options.requestOptions.headers['Transfer-Encoding'] = 'chunked'

    if (results.options.requestBodyStream.readable !== true) {
      setError('jetta-request-stream-not-readable')
      return processResults()
    }

    if (typeof results.options.redirectLimit !== 'number') {
      results.options.redirectLimit = 0
    }
  }

  if (givenURL !== null) {
    results.url = urlParser(givenURL, results.options.urlParser)

    if (results.url.isValid === false) {
      setError('jetta-request-invalid-url', results.url)
      return processResults()
    }
  } else {
    results.url = urlParser(results.options.requestOptions, results.options.urlParser)

    if (results.url.isValid === false) {
      setError('jetta-request-invalid-url', results.url)
      return processResults()
    }
  }

  progressLoggerName = results.url.url

  if (typeof results.options.checksum.algorithm === 'string') {
    checksumGenerator = crypto.createHash(results.options.checksum.algorithm)
  }

  if (typeof results.options.requestOptions.method === 'string') {
    results.options.requestOptions.method = results.options.requestOptions.method.toUpperCase()
  } else if (results.options.requestBodyStream !== null || results.options.body !== null) {
    results.options.requestOptions.method = 'POST'
  } else {
    results.options.requestOptions.method = 'GET'
  }

  if (results.options.cookieManager !== null) {
    // TEST: should wait, from above
    let cookieHeaderValue = ''
    let optionsForCreateCookieHeader = {
      isSecureEnv: false,
      preferredErrorLanguage: results.options.preferredErrorLanguage,
      requestMethod: results.options.requestOptions.method,
      requestURL: results.url.url
    }

    if (results.options.secureProtocols !== null && results.options.secureProtocols[results.url.parsedURL.protocol] === true) {
      optionsForCreateCookieHeader.isSecureEnv = true
    }

    try {
      cookieHeaderValue = results.options.cookieManager.createCookieHeader(results.url.parsedURL.hostname, results.url.parsedURL.pathname, optionsForCreateCookieHeader)
    } catch (e) {
      setError('jetta-request-error-processing-cookie-header', e)
      return processResults()
    }

    if (cookieHeaderValue !== '') {
      results.options.headers['Cookie'] = cookieHeaderValue
    }
  }

  Object.assign(results.options.requestOptions, {headers: results.options.headers}, results.url.parsedURL)

  if (Number.isSafeInteger(currentRedirects) === true) {
    results.redirects = currentRedirects
  }

  if (results.options.agents === 'object' && results.options.agents !== null && typeof results.options.agents[results.options.requestOptions.protocol] === 'object') {
    results.options.requestOptions.agent = results.options.agents[results.options.requestOptions.protocol]
  }

  if (results.options.engine[results.options.requestOptions.protocol] === 'function') {
    request = results.options.engine[results.options.requestOptions.protocol](results.options.requestOptions)
  } else if (results.url.parsedURL.protocol === 'data:') {
    handleDataProtocol()
  } else if (results.url.parsedURL.protocol === 'file:') {
    handleFileProtocol()
  } else if (results.options.requestOptions.protocol === 'http:') {
    request = http.request(results.options.requestOptions)
  } else if (results.options.requestOptions.protocol === 'https:') {
    request = https.request(results.options.requestOptions)
  } else {
    setError('jetta-request-unsupported-protocol', results.options.requestOptions.protocol)
    return processResults()
  }

  if (results.options.useDefaultProgressLogger === true) {
    results.options.progressLog = new ProgressLogger()
  }

  if (request === null) return

  requestInProgress = true

  request.on('abort', () => {
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
    results.options.requestBodyStream.on('data', (data) => {
      if (results.error === null) {
        request.write(data)
      }
    })

    results.options.requestBodyStream.on('end', () => {
      if (results.error === null) {
        request.end()
      }
    })

    results.options.requestBodyStream.on('error', (error) => {
      setError('jetta-request-stream-error', error)
      request.abort()
    })

    if (results.options.requestBodyStream._readableState.flowing !== true) {
      setError('jetta-request-stream-refused-to-flow')
      request.abort()
    }
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
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

module.exports = {
  makeRequest,
  makeRequestPromise
}
