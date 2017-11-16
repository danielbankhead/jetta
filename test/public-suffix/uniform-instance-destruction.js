'use strict'

function uniformInstanceDestructionTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformInstanceDestructionTests.name]
  const {jetta, m, ps} = sharedState

  ps.destroy()

  const destroyKeys = Object.keys(jetta.PublicSuffix.keysToDestroy)

  for (let i = 0, len = destroyKeys.length; i < len; i++) {
    t.equal(ps[destroyKeys[i]], null, m(scope, `"${destroyKeys[i]}" should be \`null\``))
  }
}

module.exports = uniformInstanceDestructionTests
