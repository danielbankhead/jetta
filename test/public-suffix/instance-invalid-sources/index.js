'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceInvalidSourcesTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceInvalidSourcesTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState

  let ps = new jetta.PublicSuffix()
  Object.assign(localSharedState, {ps})

  uniformInstanceCreationTests(t, scope, localSharedState)

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  Object.assign(localSharedState, {cachedLastUpdatedPostReady: ps.lastUpdated})

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `"${defaults.publicSuffix.path}" should not exist`))
}

module.exports = instanceInvalidSourcesTests
