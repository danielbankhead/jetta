#! /usr/local/bin/node
'use strict'

const http = require('http')
const https = require('https')
const querystring = require('querystring')
const zlib = require('zlib')

const defaults = require('../data/defaults')
const ProgressLogger = require('./progress-logger')
const urlParser = require('./url-parser')

function processCallback (data, callback) {
  if (data.error === null) {
    callback(null, data)
  } else {
    if (typeof data.error.details === 'object') {
      callback(data.error.details, data)
    } else {
      callback(new Error(data.error.type), data)
    }
  }
}

function decompressData (results, callback) {
  switch (results.responseHeaders['content-encoding']) {
    case 'gzip':
      zlib.gunzip(results.data, (error, result) => {
        if (error !== null) {
          results.error = {type: 'http-gunzip-failed', details: error}
        } else {
          results.data = result
          results.decompressed = {
            from: 'gzip',
            using: 'gunzip'
          }
        }

        processCallback(results, callback)
      })
      break
    case 'deflate':
      zlib.inflate(results.data, (error, result) => {
        if (error !== null) {
          results.error = {type: 'http-inflate-failed', details: error}
        } else {
          results.data = result
          results.decompressed = {
            from: 'deflate',
            using: 'inflate'
          }
        }

        processCallback(results, callback)
      })
      break
    default:
      processCallback(results, callback)
  }
}

function httpRequest (givenURL, options, callback, currentRedirects) {
  if (typeof options === 'function') {
    currentRedirects = callback
    callback = options
    options = {}
  }

  let results = {
    contentLength: 0,
    data: null,
    dataLength: 0,
    decompressed: null,
    error: null,
    options: Object.assign({}, defaults.request, options),
    redirects: 0,
    responseHeaders: null,
    requestOptionsFinal: null,
    statusCode: NaN,
    time: null,
    url: null
  }

  let body = null
  let urlParseResults = null
  let readableStream = null
  let headers = null
  let headerCookie = null
  let inferredRequestOptions = {
    headers: {}
  }
  let request = null
  let callbackSent = false
  let currentRequestRedirected = false

  function processResults () {
    if (callbackSent === false && currentRequestRedirected === false) {
      callbackSent = true

      if (results.error === null && results.data !== null) {
        decompressData(results, callback)
      } else {
        processCallback(results, callback)
      }
    }
  }

  if (typeof results.options.form === 'object') {
    inferredRequestOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
    body = querystring.stringify(results.options.form)
  }

  if (typeof results.options.json === 'object') {
    inferredRequestOptions.headers['content-type'] = 'application/json'
    body = JSON.stringify(results.options.json)
  }

  if (typeof results.options.body === 'string' || Buffer.isBuffer(results.options.body) === true) {
    body = results.options.body
  }

  if (typeof results.options.stream === 'object') {
    readableStream = results.options.stream
  }

  if (readableStream !== null || body !== null) {
    inferredRequestOptions.method = 'POST'
  }

  if (readableStream !== null) {
    inferredRequestOptions.headers['transfer-encoding'] = 'chunked'
  }

  if (readableStream === null && body !== null) {
    inferredRequestOptions.headers['content-length'] = Buffer.byteLength(body)
  }

  if (givenURL !== null) {
    results.url = urlParser(givenURL, Object.assign({}, defaults.request.urlParser, Object.assign({}, options).urlParser))

    if (results.url.isValid === false) {
      results.error = {type: 'http-invalid-url'}
      return processResults()
    } else {
      urlParseResults = results.url.parsedURL
    }
  }

  if (typeof results.options.cookies === 'object') {
    let cookieKeys = Object.keys(results.options.cookies)
    let cookies = []

    for (let i = 0; i < cookieKeys.length; i++) {
      cookies[cookies.length] = `${cookieKeys[i]}=${results.options.cookies[cookieKeys[i]]}`
    }

    headerCookie = {cookie: cookies.join('; ')}
  }

  headers = Object.assign({}, inferredRequestOptions.headers, results.options.headers, headerCookie)

  results.requestOptionsFinal = Object.assign(inferredRequestOptions, urlParseResults, results.options.requestOptions, {headers: headers})

  if (typeof results.requestOptionsFinal.method === 'string') {
    results.requestOptionsFinal.method = results.requestOptionsFinal.method.toUpperCase()
  }

  if (typeof currentRedirects === 'number' && isNaN(currentRedirects) === false) {
    results.redirects = currentRedirects
  }

  if (results.requestOptionsFinal.protocol === 'http:') {
    request = http.request(results.requestOptionsFinal)
  } else if (results.requestOptionsFinal.protocol === 'https:') {
    request = https.request(results.requestOptionsFinal)
  } else {
    results.error = {type: 'http-invalid-protocol'}
    return processResults()
  }

  if (results.options.useDefaultProgressLogger === true) {
    results.options.progressLog = new ProgressLogger()
  }

  const startTotalTime = Date.now()

  request.on('abort', () => {
    if (results.error === null) {
      results.error = {type: 'http-request-aborted-client'}
    }
    processResults()
  })

  request.on('aborted', () => {
    if (results.error === null) {
      results.error = {type: 'http-request-aborted-server'}
    }
    processResults()
  })

  request.on('error', (error) => {
    if (results.error === null) {
      results.error = {type: 'http-request-error', details: error}
    }
    processResults()
  })

  request.on('response', (response) => {
    let dataRecieved = []
    const startResponseTime = Date.now()

    results.responseHeaders = response.headers
    results.contentLength = Number(response.headers['content-length'])

    if (results.contentLength > results.options.dataLimit) {
      results.error = {type: 'http-exceeded-data-limit-content-length'}
      request.abort()
    }

    let dataTimeout = setTimeout(() => {
      results.error = {type: 'http-response-timed-out-initial'}
      request.abort()
    }, results.options.timeLimit)

    response.on('data', (data) => {
      clearTimeout(dataTimeout)
      results.dataLength += data.length

      if (results.options.progressLog !== null) {
        let logData = {
          current: results.dataLength,
          total: results.contentLength,
          name: 'jetta request'
        }

        if (results.url !== null) {
          logData.name = results.url.url
        }

        results.options.progressLog.log(logData)
      }

      if (results.dataLength > results.options.dataLimit) {
        results.error = {type: 'http-exceeded-data-limit-actual'}
        request.abort()
      } else {
        dataRecieved[dataRecieved.length] = data
      }

      dataTimeout = setTimeout(() => {
        results.error = {type: 'http-response-timed-out-during'}
        request.abort()
      }, results.options.timeLimit)
    })

    response.on('end', () => {
      clearTimeout(dataTimeout)
      results.time = {
        total: Date.now() - startTotalTime,
        response: Date.now() - startResponseTime
      }
      results.data = Buffer.concat(dataRecieved, results.dataLength)
      results.statusCode = response.statusCode

      if (response.statusCode > 299 && response.headers.location && results.options.redirectLimit > results.redirects && results.error === null) {
        dataRecieved = []
        results.data = null
        currentRequestRedirected = true
        results.redirects++

        httpRequest(results.responseHeaders.location, results.options, callback, results.redirects)
      } else if (response.headers.location && results.redirects >= results.options.redirectLimit && results.error === null) {
        results.error = {type: 'http-too-many-redirects'}
      } else if (response.statusCode > 299 && results.error === null) {
        results.error = {type: 'http-bad-response-code'}
      } else if (results.dataLength === 0 && results.error === null) {
        results.error = {type: 'http-no-data-received'}
      }
      processResults()
    })

    response.on('aborted', (error) => {
      if (results.error === null) {
        results.error = {type: 'http-response-aborted-client', details: error}
      }
      processResults()
    })

    response.on('error', (error) => {
      if (results.error === null) {
        results.error = {type: 'http-response-error', details: error}
      }
      processResults()
    })
  })

  request.setTimeout(results.options.timeLimit, () => {
    if (results.error === null) {
      results.error = {type: 'http-request-timed-out-initial'}
    }
    request.abort()
  })

  if (readableStream !== null) {
    // TODO: readableStream on redirect (perhaps infer max redirects = 0?)
    readableStream.on('data', (data) => {
      if (results.error === null) {
        request.write(data)
      }
    })

    readableStream.on('end', () => {
      if (results.error === null) {
        request.end()
      }
    })

    readableStream.on('error', (error) => {
      if (results.error === null) {
        results.error = {type: 'http-stream-read-error', details: error}
      }
      request.abort()
    })
  } else {
    if (body !== null) {
      request.write(body)
    }

    request.end()
  }
}

module.exports = httpRequest
