'use strict'

function isPublicSuffixTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, isPublicSuffixTests.name]
  const {config, m, ps} = sharedState

  const testCandidates = Object.keys(config.isPublicSuffixTests)

  t.equal(ps.isPublicSuffix(), false, m(scope, `.isPublicSuffix() should be \`false\``))
  t.equal(ps.isPublicSuffix({}), false, m(scope, `.isPublicSuffix({}) should be \`false\``))
  t.equal(ps.isPublicSuffix(null), false, m(scope, `.isPublicSuffix(null) should be \`false\``))
  t.equal(ps.isPublicSuffix(0), false, m(scope, `.isPublicSuffix(0) should be \`false\``))
  t.equal(ps.isPublicSuffix(1), false, m(scope, `.isPublicSuffix(1) should be \`false\``))
  t.equal(ps.isPublicSuffix(true), false, m(scope, `.isPublicSuffix(true) should be \`false\``))
  t.equal(ps.isPublicSuffix(false), false, m(scope, `.isPublicSuffix(false) should be \`false\``))

  for (let i = 0, len = testCandidates.length; i < len; i++) {
    const candidate = testCandidates[i]
    const expected = config.isPublicSuffixTests[candidate]
    t.equal(ps.isPublicSuffix(candidate), expected, m([...scope, `.isPublicSuffix("${candidate}") `], `should be \`${expected}\``))
  }
}

module.exports = isPublicSuffixTests
