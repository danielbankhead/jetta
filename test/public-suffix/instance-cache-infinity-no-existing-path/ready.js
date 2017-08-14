'use strict'

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {m, ps, cachedLastUpdated} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(ps.lastUpdated > cachedLastUpdated, true, m(scope, `"lastUpdated" should be greater than any given "lastUpdated"`))
  t.equal(ps.updateTimeout, null, m(scope, `"updateTimeout" post-ready should be \`null\``))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
