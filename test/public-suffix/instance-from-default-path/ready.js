'use strict'

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {m, ps, parsedFileCached} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(ps.lastUpdated, parsedFileCached.lastUpdated, m(scope, `"lastUpdated" should be the same if instance created within cache limit`))
  t.equal(ps.list, parsedFileCached.list, m(scope, `"list" should be the same if instance created within cache limit`))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
