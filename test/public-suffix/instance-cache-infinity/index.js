'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceCacheInfinityTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceCacheInfinityTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState
  const lastUpdatedNowDate = new Date()

  await new Promise((resolve, reject) => setTimeout(resolve, 1))

  let ps = new jetta.PublicSuffix({cacheLimit: Infinity, lastUpdated: lastUpdatedNowDate})
  Object.assign(localSharedState, {ps, cachedLastUpdated: ps.lastUpdated})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(ps.updateTimeout, null, m(scope, `"updateTimeout" should be \`null\``))
  t.notEqual(ps.lastUpdated, lastUpdatedNowDate.valueOf(), m(scope, `use "lastUpdated" from path if cacheLimit is Infinity`))

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), true, m(scope, `"${defaults.publicSuffix.path}" should still exist`))
}

module.exports = instanceCacheInfinityTests
