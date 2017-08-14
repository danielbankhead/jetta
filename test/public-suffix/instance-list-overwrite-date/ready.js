'use strict'

const fs = require('fs')

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {defaults, m, ps, cachedLastUpdated, listCache} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `path should not be created post ready`))
  t.equal(ps.lastUpdated, cachedLastUpdated, m(scope, `"lastUpdated" should not be updated`))
  t.equal(ps.cacheLimit, defaults.publicSuffix.cacheLimit, m(scope, `instance cache limit should remain the same`))
  t.equal(typeof ps.list, 'string', m(scope, `instance list should be a string`))
  t.equal(ps.list, listCache, m(scope, `instance should not be updated - since "lastUpdated" was passed`))
  t.equal(ps.path, null, m(scope, `instance path should be the same`))
  t.deepEquals(ps.sources, defaults.publicSuffix.sources, m(scope, `instance sources should be the same`))
  t.equal(ps.updating, false, m(scope, `instance should not be updating`))
  t.notEqual(ps.updateTimeout, null, m(scope, `instance timeout should not be \`null\``))

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)
    ps.updateFromSources()
  })

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
