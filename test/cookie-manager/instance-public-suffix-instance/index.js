'use strict'

const preReadyFailTests = require('../pre-ready-fail')
const uniformInstanceCreationTests = require('../uniform-instance-creation')
const uniformInstanceReadyTests = require('../uniform-instance-ready')
const uniformInstanceDestructionTests = require('../uniform-instance-destruction')
const validateExport = require('../validate-export')

async function instancePublicSuffixInstanceTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, instancePublicSuffixInstanceTests.name]
  const localSharedState = Object.assign({}, sharedState)
  const {jetta, m} = localSharedState
  const ps = new jetta.PublicSuffix({preferredErrorLanguage: 'fr', someSpecialAttribute: true})
  const instanceCreationOptions = {publicSuffix: ps, publicSuffixOptions: {someSpecialAttribute: false}}

  let cm = new jetta.CookieManager(instanceCreationOptions)
  Object.assign(localSharedState, {cm})

  validateExport(t, scope, localSharedState)

  uniformInstanceCreationTests(t, scope, localSharedState)

  t.notEqual(cm.preferredErrorLanguage, cm.publicSuffix.preferredErrorLanguage, m(scope, `".publicSuffix"'s preferredErrorLanguage should not match CookieManager's error language`))
  t.true(cm.publicSuffix.someSpecialAttribute, m(scope, `".publicSuffix" should not receive options passed from publicSuffixOptions`))

  preReadyFailTests(t, scope, localSharedState)

  await new Promise((resolve, reject) => cm.once('ready', resolve))

  await uniformInstanceReadyTests(t, scope, localSharedState)

  await uniformInstanceDestructionTests(t, scope, Object.assign({}, localSharedState, {preservePublicSuffixWhenDestroyed: true}))
}

module.exports = instancePublicSuffixInstanceTests
