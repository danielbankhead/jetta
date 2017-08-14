'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')
const validatePublicSuffixFile = require('../validate-public-suffix-file')

async function instanceOverwriteLastUpdatedTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceOverwriteLastUpdatedTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState
  const lastUpdatedNowDate = new Date()

  await new Promise((resolve, reject) => setTimeout(resolve, 1))

  let ps = new jetta.PublicSuffix({lastUpdated: lastUpdatedNowDate})
  Object.assign(localSharedState, {ps})
  Object.assign(localSharedState, {psFileCachedLastUpdated: validatePublicSuffixFile(t, scope, localSharedState).lastUpdated})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.notEqual(ps.lastUpdated, lastUpdatedNowDate.valueOf(), m(scope, `should use "lastUpdated" from path if path's "lastUpdated" has not expired (via cacheLimit)`))

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), true, m(scope, `"${defaults.publicSuffix.path}" should still exist`))
}

module.exports = instanceOverwriteLastUpdatedTests
