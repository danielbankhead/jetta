'use strict'

async function uniformInstanceDestructionTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformInstanceDestructionTests.name]
  const {config, m, cm, preservePublicSuffixWhenDestroyed} = sharedState

  let psFromCM = cm.publicSuffix

  psFromCM.cacheLimit = config.shortTimeoutForPublicSuffixDestructionTests

  await new Promise((resolve, reject) => {
    psFromCM.once('updatedPublicSuffix', resolve)
    psFromCM.updateFromSources()
  })

  if (preservePublicSuffixWhenDestroyed === true) {
    await new Promise((resolve, reject) => {
      psFromCM.once('updatedPublicSuffix', () => {
        t.pass(m(scope, `publicSuffix should not be destroyed internally and 'updatedPublicSuffix' should not have been called on \`cm.destroy(false)\``))

        psFromCM.destroy()
        resolve()
      })

      cm.destroy(false)
    })
  } else {
    psFromCM.on('error', (error) => {
      t.fail(m(scope, `publicSuffix should be destroyed internally and 'error' should not have been called. Error message: "${error.message}"`))
    })

    psFromCM.on('ready', () => {
      t.fail(m(scope, `publicSuffix should be destroyed internally and 'ready' should not have been called`))
    })

    psFromCM.on('updatedPublicSuffix', () => {
      t.fail(m(scope, `publicSuffix should be destroyed internally and 'updatedPublicSuffix' should not have been called`))
    })

    cm.destroy()
  }

  await new Promise((resolve, reject) => setTimeout(resolve, config.shortTimeoutForPublicSuffixDestructionTests))

  const destroyKeys = Object.keys(cm)

  for (let i = 0, len = destroyKeys.length; i < len; i++) {
    t.equal(cm[destroyKeys[i]], null, m(scope, `"${destroyKeys[i]}" should be \`null\` on destroy()`))
  }
}

module.exports = uniformInstanceDestructionTests
