'use strict'

const fs = require('fs')

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {config, defaults, m, ps} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `path should not be created post ready`))

  t.equal(typeof ps.lastUpdated, 'number', m(scope, `"lastUpdated" should be updated`))

  t.equal(ps.cacheLimit, defaults.publicSuffix.cacheLimit, m(scope, `instance cache limit should remain the same`))
  t.equal(typeof ps.list, 'string', m(scope, `instance list should be a string`))
  t.notEqual(ps.list, '', m(scope, `instance should be updated - since "lastUpdated" was not passed`))
  t.equal(ps.path, null, m(scope, `instance path should be the same`))
  t.deepEquals(ps.sources, defaults.publicSuffix.sources, m(scope, `instance sources should be the same`))
  t.equal(ps.updating, false, m(scope, `instance should not be updating`))
  t.notEqual(ps.updateTimeout, null, m(scope, `instance timeout should not be \`null\``))

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)

    ps.cacheLimit = config.shortCacheForImmediateNextTest

    ps.updateFromSources()
    t.equal(ps.updating, true, m(scope, `instance should be marked as updating again when checked syncronously/immediately after calling "updateFromSources"`))
  })

  t.pass(m(scope, `"updatedPublicSuffix" event should be called after updating`))
  t.equal(ps.updating, false, m(scope, `instance should be not marked as "updating" after the "updatedPublicSuffix" event has been called`))
  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `path should not be created post ready`))
  t.equal(ps.path, null, m(scope, `instance path should be the same`))

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)
  })

  ps.cacheLimit = defaults.publicSuffix.cacheLimit

  t.pass(m(scope, `"updatedPublicSuffix" event should be called automatically after timeout`))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
