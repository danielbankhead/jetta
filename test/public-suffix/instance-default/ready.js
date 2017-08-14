'use strict'

const fs = require('fs')

const isPublicSuffixTests = require('../is-public-suffix')
const validatePublicSuffixFile = require('../validate-public-suffix-file')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {config, defaults, m, ps} = sharedState

  const listCache = ps.list
  const parsedFile = validatePublicSuffixFile(t, scope, sharedState)

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  t.equal(ps.cacheLimit, defaults.publicSuffix.cacheLimit, m(scope, `instance cache limit should remain the same`))
  t.equal(typeof ps.list, 'string', m(scope, `instance list should be a string`))
  t.equal(ps.path, defaults.publicSuffix.path, m(scope, `instance path should be the same`))
  t.deepEquals(ps.sources, defaults.publicSuffix.sources, m(scope, `instance sources should be the same`))
  t.equal(ps.updating, false, m(scope, `instance should not be updating`))
  t.notEqual(ps.updateTimeout, null, m(scope, `instance timeout should not be \`null\``))
  t.notEqual(ps.lastUpdated, 0, m(scope, `instance last updated should not be 0`))

  t.equal(fs.existsSync(ps.path), true, `"${ps.path}" should exist`)

  t.doesNotThrow(ps.setupIndex.bind(ps), m(scope, `setupIndex (no arguments) not throw`))
  ps.setupIndex(listCache)

  t.equal(ps.lastUpdated, parsedFile.lastUpdated, m(scope, `setupIndex should not mutate lastUpdated`))

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)

    ps.cacheLimit = config.shortCacheForImmediateNextTest

    ps.updateFromSources()
    t.equal(ps.updating, true, m(scope, `instance should be marked as updating again when checked immediately (syncronously) after calling "updateFromSources"`))
  })

  t.pass(m(scope, `"updatedPublicSuffix" event should be called`))
  t.equal(ps.updating, false, m(scope, `instance should be not marked as "updating" after the "updatedPublicSuffix" event has been called`))
  t.notEqual(ps.lastUpdated, parsedFile.lastUpdated, m(scope, `updateFromSources should update "lastUpdated"`))

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)
  })

  ps.cacheLimit = defaults.publicSuffix.cacheLimit
  t.pass(m(scope, `"updatedPublicSuffix" event should be called automatically after timeout`))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
