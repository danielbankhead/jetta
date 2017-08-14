#! /usr/local/bin/node
'use strict'

const Bronze = require('bronze')
const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')
const defaults = require('../../data/defaults')
const testTools = require('../tools')

const dataProtocolTests = require('./data-protocol')
const fileProtocolTests = require('./file-protocol')
const generalRequestErrorTests = require('./general-request-error')
const generalRequestPromiseTests = require('./general-request-promise')
const httpProtocolsTests = require('./http-protocols')
const serversShutdown = require('./servers-shutdown')
const serversStart = require('./servers-start')

const m = testTools.generateTestMessage
const ev = testTools.errorVerification
const errorCategory = 'request'
const b = new Bronze({name: 'test-request'})
let shared = {jetta, config, defaults, testTools, errorCategory, m, ev, b, servers: {http: {}, https: {}}}

tape('request', {timeout: 5 * 60 * 1000}, (t) => {
  async function asyncTests () {
    t.equal(typeof jetta.request, 'function', `jetta.request should be a function`)
    t.equal(typeof jetta.requestPromise, 'function', `jetta.requestPromise should be a function`)
    t.equal(typeof jetta.request.constants, 'object', `jetta.request.constants should be an object`)

    t.equal(typeof jetta.request.constants.redirectsPreserveHeader, 'object', `jetta.request.constants.redirectsPreserveHeader should be an object`)
    t.equal(jetta.request.constants.redirectsPreserveHeader.ALWAYS, 1, `jetta.request.constants.redirectsPreserveHeader.ALWAYS should be 1`)
    t.equal(jetta.request.constants.redirectsPreserveHeader.NEVER, 0, `jetta.request.constants.redirectsPreserveHeader.NEVER should be 0`)
    t.equal(jetta.request.constants.redirectsPreserveHeader.SAMESITE, 2, `jetta.request.constants.redirectsPreserveHeader.SAMESITE should be 2`)

    await testTools.prepareCachedDefaultPublicSuffixList(shared.defaults)
    testTools.cleanupFiles(defaults.publicSuffix.path)

    await serversStart(shared)

    await generalRequestErrorTests(t, [], shared)
    await generalRequestPromiseTests(t, [], shared)

    await dataProtocolTests(t, [], shared)
    await fileProtocolTests(t, [], shared)
    await httpProtocolsTests(t, [], shared)

    for (let i = 0, len = config.enginesList.length; i < len; i++) {
      const engineConfig = config.enginesList[i]
      const engineScope = ['engine', engineConfig.name]
      const engineShared = Object.assign({}, shared, {engineConfig})

      await engineConfig.start()

      if (typeof engineConfig.engines['data:'] === 'function') {
        await dataProtocolTests(t, engineScope, engineShared)
      }

      if (typeof engineConfig.engines['file:'] === 'function') {
        await fileProtocolTests(t, engineScope, engineShared)
      }

      if (typeof engineConfig.engines['http:'] === 'function' || typeof engineConfig.engines['https:'] === 'function') {
        await httpProtocolsTests(t, engineScope, engineShared)
      }

      await engineConfig.shutdown()
    }

    await serversShutdown(shared)

    testTools.cleanupFiles(defaults.publicSuffix.path)

    t.end()
  }

  asyncTests()
})
