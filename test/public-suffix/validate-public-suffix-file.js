'use strict'

const fs = require('fs')
const util = require('util')

function validatePublicSuffixFile (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, validatePublicSuffixFile.name]
  const {config, m, ps} = sharedState

  const results = JSON.parse(fs.readFileSync(ps.path, 'utf8'))
  const keys = Object.keys(results)

  t.deepEquals(keys, config.expectedFilePathKeys, m(scope, `keys should be ${util.inspect(config.expectedFilePathKeys)}`))

  t.equal(Number.isSafeInteger(results.lastUpdated), true, m(scope, `written file "lastUpdated" should be a valid integer`))
  t.equal(typeof results.list, 'string', m(scope, `written file "list" should be a string`))
  t.notEqual(results.lastUpdated, 0, m(scope, `written file "lastUpdated" should not be 0`))

  return results
}

module.exports = validatePublicSuffixFile
