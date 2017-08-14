'use strict'

const fs = require('fs')

const readyTests = require('./ready')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')
const validatePublicSuffixFile = require('../validate-public-suffix-file')

async function instanceFromDefaultPathTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceFromDefaultPathTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, defaults, m} = localSharedState

  let ps = new jetta.PublicSuffix()
  Object.assign(localSharedState, {ps})
  Object.assign(localSharedState, {parsedFileCached: validatePublicSuffixFile(t, scope, localSharedState)})

  uniformInstanceCreationTests(t, scope, localSharedState)

  await new Promise((resolve, reject) => ps.once('ready', resolve))

  await readyTests(t, scope, localSharedState)

  uniformInstanceDestructionTests(t, scope, localSharedState)

  t.equal(fs.existsSync(defaults.publicSuffix.path), true, m(scope, `"${defaults.publicSuffix.path}" should still exist`))
}

module.exports = instanceFromDefaultPathTests
