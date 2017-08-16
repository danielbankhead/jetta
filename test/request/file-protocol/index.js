'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const url = require('url')

const sharedOptionsTests = require('../shared-options')
const uniformResultsExecutor = require('../uniform-results-executor')

async function fileProtocolTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, fileProtocolTests.name]
  const {testTools, m, b, engineConfig} = sharedState

  function rParams (expectedOK = true, url, options, state) {
    if (typeof engineConfig === 'object') {
      options = Object.assign({}, options, {engines: engineConfig.engines})
    }

    return Object.assign({}, sharedState, {requestParams: {expectedOK, url, options, state}})
  }

  const fileData = 'apple'
  const fileDataHash = crypto.createHash('sha384').update(fileData).digest('base64')

  const currentPathPieces = process.cwd().split(path.sep)

  const testFileURI = path.posix.join('file://', ...currentPathPieces, b.generate())
  const testFileFileURL = new url.URL(path.posix.join('file://', ...currentPathPieces, b.generate()))
  const testFileInvalidURL = `file:%`
  const testFileDirectory = new url.URL(path.posix.join('file://', ...currentPathPieces, b.generate()))
  const testFileNoExist = new url.URL(path.posix.join('file://', ...currentPathPieces, b.generate()))
  const sharedOptionsParams = {
    testURL: testFileURI,
    sha384Base64Checksum: fileDataHash
  }

  fs.writeFileSync(new url.URL(testFileURI), fileData)
  fs.writeFileSync(testFileFileURL, fileData)
  fs.mkdirSync(testFileDirectory)

  const testFileURIResults = await uniformResultsExecutor(t, [...scope, 'full path'], rParams(true, testFileURI))
  const testFileFileURLResults = await uniformResultsExecutor(t, [...scope, 'partial path'], rParams(true, testFileFileURL))

  const testFileURIHash = crypto.createHash('sha384').update(testFileURIResults.data).digest('base64')
  const testFileFileURLHash = crypto.createHash('sha384').update(testFileFileURLResults.data).digest('base64')

  t.equal(testFileURIHash, fileDataHash, m(scope, 'request for file should read a file with a valid hash'))
  t.equal(testFileFileURLHash, fileDataHash, m(scope, 'request for file URL should read a file with a valid hash'))

  await uniformResultsExecutor(t, [...scope, 'invalid file URL'], rParams(false, testFileInvalidURL))
  await uniformResultsExecutor(t, [...scope, 'is directory'], rParams(false, testFileDirectory))
  await uniformResultsExecutor(t, [...scope, 'no exist'], rParams(false, testFileNoExist))

  await sharedOptionsTests(t, scope, Object.assign({}, sharedState, {sharedOptionsParams, engineConfig}))

  testTools.cleanupFiles(new url.URL(testFileURI), testFileFileURL)
  fs.rmdirSync(testFileDirectory)
}

module.exports = fileProtocolTests
