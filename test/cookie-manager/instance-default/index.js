'use strict'

const preReadyFailTests = require('../pre-ready-fail')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceReadyTests = require('../uniform-instance-ready')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')
const validateExport = require('../validate-export')

async function instanceDefaultTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instanceDefaultTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, m} = localSharedState

  let cm = new jetta.CookieManager()
  Object.assign(localSharedState, {cm})

  validateExport(t, scope, localSharedState)

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.equal(cm.preferredErrorLanguage, cm.publicSuffix.preferredErrorLanguage, m(scope, `".publicSuffix"'s preferredErrorLanguage should match CookieManager's error language`))

  preReadyFailTests(t, scope, localSharedState)

  await new Promise((resolve, reject) => cm.once('ready', resolve))

  await uniformInstanceReadyTests(t, scope, localSharedState)

  await uniformInstanceDestructionTests(t, scope, Object.assign({}, localSharedState, {preservePublicSuffixWhenDestroyed: true}))
  await uniformInstanceDestructionTests(t, scope, Object.assign({}, localSharedState, {cm: new jetta.CookieManager()}))
}

module.exports = instanceDefaultTests
