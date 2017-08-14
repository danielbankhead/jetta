'use strict'

const sharedOptionsTests = require('../shared-options')
const uniformResultsExecutor = require('../uniform-results-executor')

async function dataProtocolTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, dataProtocolTests.name]
  const {config, m, engineConfig} = sharedState

  function rParams (expectedOK = true, url, options, state) {
    if (typeof engineConfig === 'object') {
      options = Object.assign({}, options, {engines: engineConfig.engines})
    }

    return Object.assign({}, sharedState, {requestParams: {expectedOK, url, options, state}})
  }

  for (let i = 0, len = config.dataProtocol.invalid.length; i < len; i++) {
    const invalid = config.dataProtocol.invalid[i]
    await uniformResultsExecutor(t, [...scope, invalid], rParams(false, invalid))
  }

  for (let i = 0, len = config.dataProtocol.valid.length; i < len; i++) {
    const valid = config.dataProtocol.valid[i]
    const nestedScope = [...scope, valid.uri]
    const results = await uniformResultsExecutor(t, nestedScope, rParams(true, valid.uri))

    t.equal(Buffer.compare(results.data, valid.expected), 0, m(nestedScope, `should return the correct data results`))
    t.equal(results.responseHeaders['content-type'], valid['content-type'], m(nestedScope, `should have the correct Content-Type`))
  }

  const jsonExampleScope = [...scope, 'json']
  const jsonExampleResults = await uniformResultsExecutor(t, jsonExampleScope, rParams(true, config.dataProtocol.jsonExample.uri))

  t.equal(Buffer.compare(jsonExampleResults.data, config.dataProtocol.jsonExample.expected), 0, m(jsonExampleScope, `should return the correct data results`))
  t.equal(typeof jsonExampleResults.json, 'object', m(jsonExampleScope, `results.json should be an object`))
  t.notEqual(jsonExampleResults.json, null, m(jsonExampleScope, `should not be \`null\``))

  await sharedOptionsTests(t, scope, Object.assign({}, sharedState, {sharedOptionsParams: config.dataProtocol.sharedOptionsParams, engineConfig}))
}

module.exports = dataProtocolTests
