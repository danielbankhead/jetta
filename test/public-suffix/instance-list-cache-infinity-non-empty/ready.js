'use strict'

const fs = require('fs')

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {defaults, m, ps, listCache} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `path should not be created post ready`))
  t.notEqual(ps.lastUpdated, 0, m(scope, `"lastUpdated" should be not be 0`))
  t.equal(ps.cacheLimit, Infinity, m(scope, `instance cache limit should remain the same`))
  t.equal(typeof ps.list, 'string', m(scope, `instance list should be a string`))
  t.notEqual(ps.list, listCache, m(scope, `instance should be updated`))
  t.equal(ps.path, null, m(scope, `instance path should be the same`))
  t.deepEquals(ps.sources, defaults.publicSuffix.sources, m(scope, `instance sources should be the same`))
  t.equal(ps.updating, false, m(scope, `instance should not be updating`))
  t.equal(ps.updateTimeout, null, m(scope, `instance timeout be \`null\``))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
