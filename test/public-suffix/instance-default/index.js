'use strict'

const fs = require('fs')
const util = require('util')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceDefaultTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceDefaultTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState

  let ps = new jetta.PublicSuffix()
  Object.assign(localSharedState, {ps})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(ps.cacheLimit, defaults.publicSuffix.cacheLimit, m(scope, `instance cache limit should be 1 day`))
  t.equal(ps.lastUpdated, 0, m(scope, `instance last updated should be 0`))
  t.equal(ps.list, null, m(scope, `instance list should be \`null\``))
  t.equal(ps.path, defaults.publicSuffix.path, m(scope, `instance path should be "${defaults.publicSuffix.path}"`))
  t.deepEquals(ps.sources, defaults.publicSuffix.sources, m(scope, `instance sources should be
    \`${util.inspect(defaults.publicSuffix.sources)}\``))
  t.equal(ps.updating, true, m(scope, `instance should be updating when checked syncronously/immediately upon creation`))
  t.equal(ps.updateTimeout, null, m(scope, `instance timeout should be \`null\``))

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), true, m(scope, `"${defaults.publicSuffix.path}" should still exist`))
}

module.exports = instanceDefaultTests
