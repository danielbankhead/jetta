'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceListOverwriteLastedUpdatedTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceListOverwriteLastedUpdatedTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState
  const lastUpdatedNowDate = new Date()

  let ps = new jetta.PublicSuffix({lastUpdated: lastUpdatedNowDate, list: ''})
  Object.assign(localSharedState, {ps, cachedLastUpdated: lastUpdatedNowDate.valueOf(), listCache: ps.list})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(ps.lastUpdated, lastUpdatedNowDate.valueOf(), m(scope, `"lastUpdated" should be equal to the passed "lastUpdated"`))
  t.equal(ps.path, null, m(scope, `path should be \`null\``))
  t.equal(ps.list, '', m(scope, `instance list be an empty string (since it was passed as an empty string)`))

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `"${defaults.publicSuffix.path}" should not exist`))
}

module.exports = instanceListOverwriteLastedUpdatedTests
