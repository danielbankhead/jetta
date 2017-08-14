'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instancePathListExpiredTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instancePathListExpiredTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState

  await new Promise((resolve, reject) => setTimeout(resolve, 1))

  let ps = new jetta.PublicSuffix({cacheLimit: 1})
  Object.assign(localSharedState, {ps, cachedLastUpdated: ps.lastUpdated})

  uniformInstanceCreationTests(t, scope, localSharedState)

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), true, m(scope, `"${defaults.publicSuffix.path}" should still exist`))
}

module.exports = instancePathListExpiredTests
