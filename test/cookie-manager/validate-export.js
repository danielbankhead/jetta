'use strict'

function validateExport (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, validateExport.name]
  const {m, packageInfo, cm} = sharedState
  const cachedPublicSuffixInstance = Object.assign({}, cm.publicSuffix)
  const exportData = cm.export()

  t.equal(typeof exportData, 'object', m(scope, `".export()" should work, even if not ready`))
  t.notEqual(exportData, null, m(scope, `".export()" should not return \`null\``))

  t.doesNotThrow(() => { JSON.stringify(exportData) }, m(scope, `".export()" should be JSON-stringifyable`))
  t.equal(exportData.jettaVersion, packageInfo.version, m(scope, `".export().jettaVersion" should equal package.json's version`))

  t.equal(exportData.publicSuffix, undefined, m(scope, `".export().publicSuffix" should be \`undefined\``))
  t.deepEqual(cm.publicSuffix, cachedPublicSuffixInstance, m(scope, `".export()" should not modify cookie manager's public suffix instance`))
}

module.exports = validateExport
