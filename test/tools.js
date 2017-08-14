#! /usr/local/bin/node
'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

const jetta = require('../')

function cleanupFiles (...files) {
  for (let i = 0, len = files.length; i < len; i++) {
    try {
      fs.unlinkSync(files[i])
    } catch (e) {}
  }
}

function errorVerification (state = {t: () => {}, scope: [], e: new jetta.JettaError(), errorCategory: '', preferredErrorLanguage: ''}) {
  const {t, scope, e, errorCategory, preferredErrorLanguage} = state

  function em (message = '') {
    return generateTestMessage([...scope, errorVerification.name], message)
  }

  if (errorCategory === 'cookie') {
    t.true(/^jetta-cookie/.test(e.code), em(`error code starts with 'jetta-cookie'`))
    t.true(e.message.toLowerCase().includes('cookie'), em(`error message should contain the word 'cookie' to help with context.`))
  }

  if (errorCategory === 'public-suffix') {
    t.true(/^jetta-public-suffix/.test(e.code), em(`error code starts with 'jetta-public-suffix'`))
    t.true(e.message.toLowerCase().includes('publicsuffix') || e.message.toLowerCase().includes('public suffix'), em(`error message should contain the words 'publicsuffix' or 'public suffix' to help with context.`))
  }

  if (errorCategory === 'request') {
    t.true(/^jetta-request/.test(e.code), em(`error code starts with 'jetta-request'`))
    t.true(e.message.toLowerCase().includes('request'), em(`error message should contain the word 'request' to help with context.`))
  }

  t.false(/\.$/.test(e.message), em(`error message should not end with a period`))
  t.false(e.message.includes('undefined'), em(`error.message should not contain the string 'undefined'`))

  t.true(e instanceof jetta.JettaError, em(`error should be an instance of JettaError`))
  t.true(e instanceof Error, em(`error should be an instance of Error`))
  t.true(typeof e.details === 'object' || typeof e.details === 'string', em(`error.details should be an object or string`))
  t.notEqual(e.details, null, em(`error.details should not be \`null\``))
  t.equal(typeof e.lang, 'string', em(`error.lang should be a string`))
  t.equal(e.lang, preferredErrorLanguage, em(`error.lang should be '${preferredErrorLanguage}'`))
  t.true(e.lang.length > 0, em(`error.lang's length should be greater than 0`))
  t.equal(typeof e.stack, 'string', em(`error.stack should be a string`))
}

function generateTestMessage (scope = [], message = '') {
  let scopePieces = []

  for (let i = 0, len = scope.length; i < len; i++) {
    scopePieces[scopePieces.length] = util.inspect(scope[i])
  }

  return `${scopePieces.join(' > ')} ::: ${message}`
}

async function prepareCachedDefaultPublicSuffixList (defaultsObject = {}) {
  const cachedPublicSuffixPath = path.join(__dirname, '..', 'data', 'test', '.cached-public-suffix.dat')

  if (fs.existsSync(cachedPublicSuffixPath) === false) {
    const errorMessages = []
    for (let i = 0, len = defaultsObject.publicSuffix.sources.length; i < len; i++) {
      try {
        await jetta.requestPromise(defaultsObject.publicSuffix.sources[i], {toFile: cachedPublicSuffixPath})
      } catch (e) {
        errorMessages[errorMessages.length] = e.code
      }
    }

    if (fs.existsSync(cachedPublicSuffixPath) === false) {
      throw new Error(`Received the following error codes while attempting to cache public suffix data to cut time and bandwidth for tests: ${errorMessages.join(', ')}`)
    }
  }

  if (defaultsObject.publicSuffix.sources.includes(cachedPublicSuffixPath) === false) {
    defaultsObject.publicSuffix.sources = [cachedPublicSuffixPath, ...defaultsObject.publicSuffix.sources]
  }
}

module.exports = {
  cleanupFiles,
  errorVerification,
  generateTestMessage,
  prepareCachedDefaultPublicSuffixList
}
