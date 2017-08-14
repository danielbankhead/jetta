#! /usr/local/bin/node
'use strict'

const url = require('url')
const util = require('util')

const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')
const testTools = require('../tools')

const m = testTools.generateTestMessage

tape('url-parser', (t) => {
  function validateResults (parentScope = [], results = {}) {
    const resultsKeys = Object.keys(results)
    const resultsOptionKeys = Object.keys(results.options)

    function vm (subscope = '', message = '') {
      return m([...parentScope, subscope], message)
    }

    t.deepEqual(resultsKeys, config.expectedResultsKeys, m(parentScope, `should have ${util.inspect(config.expectedResultsKeys)}`))
    t.equal(typeof results.isLocalhost, 'boolean', vm(`.isLocalhost`, `should be a boolean`))
    t.equal(typeof results.isValid, 'boolean', vm(`.isValid`, `should be a boolean`))
    t.equal(typeof results.options, 'object', vm(`.options`, `should be a object`))
    t.notEqual(results.options, null, vm(`.options`, `should not be \`null\``))
    t.equal(typeof results.parsedURL, 'object', vm(`.parsedURL`, `should be a object`))

    if (results.parsedURL !== null) {
      t.true(results.parsedURL instanceof url.Url, vm(`.parsedURL`, `should be an instance of url.Url when parsedURL is not \`null\``))
    }

    t.equal(typeof results.url, 'string', vm(`.url`, `should be a string`))

    t.deepEqual(resultsOptionKeys, config.expectedResultsOptionsKeys, vm(`.options`, `should have ${util.inspect(config.expectedResultsOptionsKeys)}`))
    t.equal(typeof results.options.addMissingProtocol, 'boolean', vm(`.options.addMissingProtocol`, `should be a boolean`))
    t.equal(typeof results.options.allowWhitespaceBeforeFormatting, 'boolean', vm(`.allowWhitespaceBeforeFormatting`, `should be a boolean`))
    t.equal(typeof results.options.ipAddressesAllowed, 'boolean', vm(`.options.ipAddressesAllowed`, `should be a boolean`))
    t.equal(typeof results.options.localhostAllowed, 'boolean', vm(`.options.localhostAllowed`, `should be a boolean`))
    t.equal(typeof results.options.protocolsAllowed, 'object', vm(`.options.protocolsAllowed`, `should be a object`))
    t.equal(typeof results.options.protocolReplacement, 'string', vm(`.options.protocolReplacement`, `should be a object`))
  }

  t.equal(typeof jetta.urlParser, 'function', `jetta.urlParser should be a object`)
  t.equal(jetta.urlParser.length, 0, `jetta.urlParser should have a length of 0 (due to defaults)`)

  t.equal(jetta.urlParser('example.com', {addMissingProtocol: true, protocolReplacement: config.protocolReplacement}).parsedURL.protocol, config.protocolReplacement, `\`jetta.urlParser('example.com', ${util.inspect({addMissingProtocol: true, protocolReplacement: config.protocolReplacement})})\`'s protocol should be ${config.protocolReplacement}`)

  for (let i = 0, len = config.validatorList.length; i < len; i++) {
    const {source, valid, invalid} = config.validatorList[i]

    for (let j = 0, jLen = valid.length; j < jLen; j++) {
      const value = valid[j][0]
      const options = valid[j][1]
      const nestedScope = ['validator', source, {url: value, options}]
      const results = jetta.urlParser(value, options)

      t.true(results.isValid, m(nestedScope, `should be valid`))
      validateResults(nestedScope, results)
    }

    for (let j = 0, jLen = invalid.length; j < jLen; j++) {
      const value = invalid[j][0]
      const options = invalid[j][1]
      const nestedScope = ['validator', source, {url: value, options}]
      const results = jetta.urlParser(value, options)

      t.false(results.isValid, m(nestedScope, `should be invalid`))
      validateResults(nestedScope, results)
    }
  }

  t.end()
})
