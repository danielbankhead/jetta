'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceListCacheInfinityNonEmptyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceListCacheInfinityNonEmptyTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState

  await new Promise((resolve, reject) => setTimeout(resolve, 1))

  let ps = new jetta.PublicSuffix({cacheLimit: Infinity, list: ''})
  Object.assign(localSharedState, {ps, listCache: ps.list})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(ps.lastUpdated, 0, m(scope, `"lastUpdated" should be 0`))
  t.equal(ps.path, null, m(scope, `path should be \`null\``))
  t.equal(ps.list, '', m(scope, `instance list be an empty string (since it was passed as an empty string)`))

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `"${defaults.publicSuffix.path}" should not exist`))
}

module.exports = instanceListCacheInfinityNonEmptyTests
