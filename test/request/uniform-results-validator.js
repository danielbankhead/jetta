'use strict'

function uniformResultsValidator (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformResultsValidator.name]
  const {m, results} = sharedState

  t.equal(typeof results, 'object', m(scope, `results should be an object`))
  t.true(typeof results.checksum === 'string' || results.checksum === null, m(scope, `results.checksum should be a string or \`null\``))
  t.equal(Buffer.isBuffer(results.data) || results.data === null, true, m(scope, `results.data should be a Buffer or \`null\``))
  t.true(Array.isArray(results.dataEncoding) === true || results.dataEncoding === null, m(scope, `results.dataEncoding should be an array or \`null\``))
  t.equal(typeof results.error, 'object', m(scope, `results.error should be an object`))
  t.equal(typeof results.json, 'object', m(scope, `results.json should be an object`))
  t.equal(typeof results.lengths, 'object', m(scope, `results.lengths should be an object`))
  t.equal(typeof results.lengths.content, 'number', m(scope, `results.lengths.content should be a number`))
  t.true(Number.isSafeInteger(results.lengths.data), m(scope, `results.lengths.data should be a safe integer`))
  t.true(Number.isSafeInteger(results.lengths.decompressed), m(scope, `results.lengths.decompressed should be a safe integer`))
  t.true(Number.isSafeInteger(results.lengths.response), m(scope, `results.lengths.response should be a safe integer`))

  t.equal(typeof results.options, 'object', m(scope, `results.options should be an object`))
  t.equal(typeof results.options.checksum, 'object', m(scope, `results.options.checksum should be an object`))
  t.notEqual(results.options.checksum, null, m(scope, `results.options.checksum should not be \`null\``))
  t.equal(typeof results.options.engines, 'object', m(scope, `results.options.engines should be an object`))
  t.notEqual(results.options.engines, null, m(scope, `results.options.engines should not be \`null\``))
  t.equal(typeof results.options.redirectsPreserveHeader, 'object', m(scope, `results.options.redirectsPreserveHeader should be an object`))
  t.notEqual(results.options.redirectsPreserveHeader, null, m(scope, `results.options.redirectsPreserveHeader should not be \`null\``))
  t.equal(typeof results.options.requestOptions, 'object', m(scope, `results.options.requestOptions should be an object`))
  t.notEqual(results.options.requestOptions, null, m(scope, `results.options.requestOptions should not be \`null\``))
  t.equal(typeof results.options.secureProtocols, 'object', m(scope, `results.options.secureProtocols should be an object`))
  t.notEqual(results.options.secureProtocols, null, m(scope, `results.options.secureProtocols should not be \`null\``))
  t.equal(typeof results.options.urlParser, 'object', m(scope, `results.options.urlParser should be an object`))
  t.notEqual(results.options.urlParser, null, m(scope, `results.options.urlParser should not be \`null\``))

  t.true(Array.isArray(results.redirects), m(scope, `results.redirects should be an object`))

  for (let i = 0, len = results.redirects; i < len; i++) {
    uniformResultsValidator(t, [...scope, 'result from results.redirect'], Object.assign({}, sharedState, {results: results.redirects[i]}))
  }

  t.equal(typeof results.responseHeaders, 'object', m(scope, `results.responseHeaders should be an object`))
  t.notEqual(results.responseHeaders, null, m(scope, `results.responseHeaders should not be \`null\``))
  t.equal(typeof results.statusCode, 'number', m(scope, `results.statusCode should be a number`))

  t.equal(typeof results.time, 'object', m(scope, `results.time should be an object`))
  t.notEqual(results.time, null, m(scope, `results.time should not be null`))
  t.true(Number.isSafeInteger(results.time.total), m(scope, `results.time.total should be a safe integer`))
  t.equal(typeof results.time.request, 'number', m(scope, `results.time.request should be a number`))
  t.equal(typeof results.time.requestResponse, 'number', m(scope, `results.time.requestResponse should be a number`))

  t.equal(typeof results.url, 'object', m(scope, `results.url should be an object`))
  t.equal(typeof results.url.isLocalhost, 'boolean', m(scope, `results.url.isLocalhost should be a boolean`))
  t.equal(typeof results.url.isValid, 'boolean', m(scope, `results.url.isValid should be a boolean`))
  t.equal(typeof results.url.options, 'object', m(scope, `results.url.options should be an object`))
  t.notEqual(results.url.options, null, m(scope, `results.url.options should not be \`null\``))
  t.equal(typeof results.url.parsedURL, 'object', m(scope, `results.url.parsedURL should be an object`))
  t.notEqual(results.url.parsedURL, null, m(scope, `results.url.parsedURL should not be \`null\``))
  t.equal(typeof results.url.url, 'string', m(scope, `results.url.url should be a string`))
}

module.exports = uniformResultsValidator
