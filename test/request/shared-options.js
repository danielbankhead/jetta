'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const url = require('url')

const uniformResultsExecutor = require('./uniform-results-executor')
const uniformResultsValidator = require('./uniform-results-validator')

async function sharedOptionsTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, sharedOptionsTests.name]
  const {config, testTools, m, b, sharedOptionsParams, engineConfig} = sharedState
  const {testURL, sha384Base64Checksum, socketPath, pathname, protocol} = sharedOptionsParams

  function rParams (expectedOK = true, url, options, state) {
    if (typeof engineConfig === 'object') {
      options = Object.assign({}, options, {engines: engineConfig.engines})
    }

    let requestParams = {expectedOK, url, options, state}

    if (typeof socketPath === 'string') {
      if (typeof requestParams.options !== 'object' || requestParams.options === null) {
        requestParams.options = {requestOptions: {socketPath, pathname, protocol}}
      } else if (typeof requestParams.options.requestOptions !== 'object' || requestParams.options.requestOptions === null) {
        requestParams.options.requestOptions = {socketPath, pathname, protocol}
      } else {
        requestParams.options.requestOptions.socketPath = socketPath
        requestParams.options.requestOptions.pathname = pathname
        requestParams.options.requestOptions.protocol = protocol
      }

      if (requestParams.options.requestOptions.protocol === 'https:') {
        Object.assign(options.requestOptions, config.TLSTestCertAndKey)
      }
    }

    return Object.assign({}, sharedState, {requestParams})
  }

  await new Promise((resolve, reject) => {
    const nestedScope = [...scope, 'onResponseData']
    let onResponseDataCalledCount = 0
    let dataParts = []
    let dataLength = 0

    function onResponseData (data = Buffer.from([]), results = {}) {
      onResponseDataCalledCount++

      const deepNestedScope = [...nestedScope, 'called', onResponseDataCalledCount]

      if (results.error !== null) {
        t.fail(m(deepNestedScope, `results.error should be \`null\``))
      }

      dataLength += data.length
      dataParts[dataParts.length] = data

      uniformResultsValidator(t, deepNestedScope, Object.assign({}, sharedState, {results}))
    }

    uniformResultsExecutor(t, nestedScope, rParams(true, testURL, {onResponseData})).then((results) => {
      if (onResponseDataCalledCount === 0) {
        t.fail(m(nestedScope, `expected \`onResponseData\` to have been called before completion`))
      } else if (results.error !== null) {
        t.fail(m(nestedScope, `expected \`results.error\` to be \`null\``))
      } else {
        const onResponseDataConcat = Buffer.concat(dataParts, dataLength)

        t.equal(Buffer.compare(onResponseDataConcat, results.data), 0, m(nestedScope, `\`onResponseData\`'s data concatenated should be the same as results.data (when results.data is available)`))
      }

      resolve()
    })
  })

  const storeDataInResultsScope = [...scope, 'storeDataInResults']
  const storeDataInResultsResults = await uniformResultsExecutor(t, storeDataInResultsScope, rParams(true, testURL, {storeDataInResults: false}))

  t.equal(storeDataInResultsResults.data, null, m(storeDataInResultsScope, `results.data should be \`null\` when storeDataInResultsScope = false`))
  t.equal(storeDataInResultsResults.json, null, m(storeDataInResultsScope, `results.json should be \`null\` when storeDataInResultsScope = false`))

  await uniformResultsExecutor(t, [...scope, 'data limit'], rParams(false, testURL, {dataLimit: 1}))

  const checksumScope = [...scope, 'checksum']

  for (let i = 0, len = config.sharedOptions.checksumAlgorithms.length; i < len; i++) {
    const checksumAlgorithm = config.sharedOptions.checksumAlgorithms[i]
    const nestedScope = [...checksumScope, 'algorithm', checksumAlgorithm]

    const results = await uniformResultsExecutor(t, nestedScope, rParams(true, testURL, {checksum: {algorithm: checksumAlgorithm}}))

    t.equal(typeof results.checksum, 'string', m(nestedScope, `results.checksum should be a string`))
    t.true(results.checksum.length > 0, m(nestedScope, `results.checksum should have a length > 0`))

    const resultsHexDigestScope = [...nestedScope, 'hex digest']
    const resultsHexDigest = await uniformResultsExecutor(t, resultsHexDigestScope, rParams(true, testURL, {checksum: {algorithm: checksumAlgorithm, digest: 'hex'}}))

    t.equal(typeof resultsHexDigest.checksum, 'string', m(resultsHexDigestScope, `results.checksum should be a string`))
    t.true(resultsHexDigest.checksum.length > 0, m(resultsHexDigestScope, `results.checksum should have a length > 0`))

    const resultsBase64DigestScope = [...nestedScope, 'base64 digest']
    const resultsBase64Digest = await uniformResultsExecutor(t, resultsBase64DigestScope, rParams(true, testURL, {checksum: {algorithm: checksumAlgorithm, digest: 'base64'}}))

    t.equal(typeof resultsBase64Digest.checksum, 'string', m(resultsBase64DigestScope, `results.checksum should be a string`))
    t.true(resultsBase64Digest.checksum.length > 0, m(resultsBase64DigestScope, `results.checksum should have a length > 0`))
  }

  await uniformResultsExecutor(t, [...checksumScope, 'invalid algorithm'], rParams(false, testURL, {checksum: {algorithm: ''}}))
  await uniformResultsExecutor(t, [...checksumScope, 'invalid digest'], rParams(false, testURL, {checksum: {algorithm: 'sha384', digest: '!'}}))

  await uniformResultsExecutor(t, [...checksumScope, 'expected'], rParams(true, testURL, {checksum: {algorithm: 'sha384', digest: 'base64', expected: sha384Base64Checksum}}))
  await uniformResultsExecutor(t, [...checksumScope, 'expected error'], rParams(false, testURL, {checksum: {algorithm: 'sha384', digest: 'base64', expected: `${sha384Base64Checksum}.`}}))

  const toFileScope = [...scope, 'toFile']

  const testToFileFullPath = path.join(process.cwd(), b.generate())
  const testToFilePartialPath = b.generate()
  const testToFileFileURL = new url.URL(`file://${path.join(process.cwd(), b.generate())}`)

  const testToFileErrorPath = b.generate()
  const testToFileErrorPathIsFile = path.join(testToFileErrorPath, b.generate())

  fs.writeFileSync(testToFileErrorPath, 'some data')

  await uniformResultsExecutor(t, [...toFileScope, 'full path'], rParams(true, testURL, {toFile: testToFileFullPath}))
  await uniformResultsExecutor(t, [...toFileScope, 'partial path'], rParams(true, testURL, {toFile: testToFilePartialPath}))
  await uniformResultsExecutor(t, [...toFileScope, 'file URL'], rParams(true, testURL, {toFile: testToFileFileURL}))

  t.true(fs.existsSync(testToFileFullPath), m(toFileScope, 'file from full path should exist'))
  t.true(fs.existsSync(testToFilePartialPath), m(toFileScope, 'file from partial path should exist'))
  t.true(fs.existsSync(testToFileFileURL), m(toFileScope, 'file from file URL should exist'))

  const testToFileFullPathHash = crypto.createHash('sha384').update(fs.readFileSync(testToFileFullPath)).digest('base64')
  const testToFilePartialPathHash = crypto.createHash('sha384').update(fs.readFileSync(testToFilePartialPath)).digest('base64')
  const testToFileFileURLHash = crypto.createHash('sha384').update(fs.readFileSync(testToFileFileURL)).digest('base64')

  t.equal(testToFileFullPathHash, sha384Base64Checksum, m(toFileScope, 'file from full path should write a file with a valid hash'))
  t.equal(testToFilePartialPathHash, sha384Base64Checksum, m(toFileScope, 'file from partial path should write a file with a valid hash'))
  t.equal(testToFileFileURLHash, sha384Base64Checksum, m(toFileScope, 'file from file URL should write a file with a valid hash'))

  await uniformResultsExecutor(t, [...toFileScope, 'write error'], rParams(false, testURL, {toFile: testToFileErrorPathIsFile}))

  testTools.cleanupFiles(testToFileFullPath, testToFilePartialPath, testToFileFileURL, testToFileErrorPath)
}

module.exports = sharedOptionsTests
