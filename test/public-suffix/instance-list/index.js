'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')

async function instanceListTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceListTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, testTools, m} = localSharedState

  let ps = new jetta.PublicSuffix({list: ''})
  Object.assign(localSharedState, {ps})

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(ps.lastUpdated, 0, m(scope, `"lastUpdated" should be 0 and not read from path`))
  t.equal(ps.path, null, m(scope, `path should be \`null\``))
  t.equal(ps.list, '', m(scope, `instance list be an empty string (since it was passed as an empty string)`))

  testTools.cleanupFiles(defaults.publicSuffix.path)

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), false, m(scope, `"${defaults.publicSuffix.path}" should not exist`))
}

module.exports = instanceListTests
