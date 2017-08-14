'use strict'

const fs = require('fs')
const path = require('path')

const isPublicSuffixTests = require('../is-public-suffix')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {config, defaults, testTools, errorCategory, m, ev, ps, cachedLastUpdatedPostReady} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  ps.on('ready', readyEventFail)

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]
    let nestedScope = []

    ps.preferredErrorLanguage = preferredErrorLanguage

    ps.sources = null
    nestedScope = [...scope, `sources = \`null\``]

    await new Promise((resolve, reject) => {
      ps.once('error', (error) => {
        ev({t, scope: nestedScope, e: error, errorCategory, preferredErrorLanguage})
        t.equal(ps.lastUpdated, cachedLastUpdatedPostReady, m(nestedScope, `should not update "lastUpdated"`))
        resolve()
      })

      ps.updateFromSources()
    })

    ps.sources = []
    nestedScope = [...scope, `sources = \`[]\``]

    await new Promise((resolve, reject) => {
      ps.once('error', (error) => {
        ev({t, scope: nestedScope, e: error, errorCategory, preferredErrorLanguage})
        t.equal(ps.lastUpdated, cachedLastUpdatedPostReady, m(nestedScope, `should not update "lastUpdated"`))
        resolve()
      })

      ps.updateFromSources()
    })

    ps.sources = ['invalidSource', 'https://invalidSource2']
    nestedScope = [...scope, `non-existant sources`]

    await new Promise((resolve, reject) => {
      ps.once('error', (error) => {
        ev({t, scope: nestedScope, e: error, errorCategory, preferredErrorLanguage})
        t.equal(ps.lastUpdated, cachedLastUpdatedPostReady, m(nestedScope, `should not update "lastUpdated"`))
        resolve()
      })

      ps.updateFromSources()
    })

    ps.sources = defaults.publicSuffix.sources
    nestedScope = [...scope, `file write error`]

    testTools.cleanupFiles(defaults.publicSuffix.path)
    fs.writeFileSync(defaults.publicSuffix.path, '')

    ps.path = path.join(defaults.publicSuffix.path, 'somethingThatShouldFail.json')

    await new Promise((resolve, reject) => {
      ps.once('error', (error) => {
        ev({t, scope: nestedScope, e: error, errorCategory, preferredErrorLanguage})
        t.equal(ps.lastUpdated, cachedLastUpdatedPostReady, m(nestedScope, `should not update "lastUpdated"`))
        resolve()
      })

      ps.updateFromSources()
    })

    testTools.cleanupFiles(defaults.publicSuffix.path)
  }

  ps.path = null
  ps.preferredErrorLanguage = defaults.publicSuffix.preferredErrorLanguage
  ps.sources = ['invalidSource', ...defaults.publicSuffix.sources]

  await new Promise((resolve, reject) => {
    ps.once('updatedPublicSuffix', resolve)
    ps.updateFromSources()
  })

  t.pass(m(scope, `should fallback to previous sources and should not issue any errors if the fallbacks are successful`))

  isPublicSuffixTests(t, scope, sharedState)

  ps.removeListener('ready', readyEventFail)
}

module.exports = readyTests
