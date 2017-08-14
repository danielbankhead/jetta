'use strict'

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {m, ps, psFileCachedLastUpdated} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(ps.lastUpdated, psFileCachedLastUpdated, m(scope, `"lastUpdated" should be equal to publicSuffixFile's "lastUpdated"`))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
