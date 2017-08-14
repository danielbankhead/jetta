'use strict'

const events = require('events')

function uniformInstanceCreationTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformInstanceCreationTests.name]
  const {config, defaults, errorCategory, m, ev, ps} = sharedState

  t.equal(ps.ready, false, m(scope, `instance should not be ready syncronously/immediately upon creation`))
  t.true(ps instanceof events, m(scope, `instance should be an instance of events`))

  t.equal(typeof ps.destroy, 'function', m(scope, `instance should have a "destroy" method`))
  t.equal(typeof ps.setReady, 'function', m(scope, `instance should have a "setReady" method`))
  t.equal(typeof ps.setupIndex, 'function', m(scope, `instance should have a "setupIndex" method`))
  t.equal(typeof ps.isPublicSuffix, 'function', m(scope, `instance should have a "isPublicSuffix" method`))
  t.equal(typeof ps.updateFromSources, 'function', m(scope, `instance should have a "updateFromSources" method`))

  t.equal(typeof ps.cacheLimit, 'number', m(scope, `instance.cacheLimit should be a number`))

  t.equal(typeof ps.exceptionsIndex, 'object', m(scope, `instance.exceptionsIndex should be an object`))
  t.equal(typeof ps.index, 'object', m(scope, `instance.index should be an object`))
  t.equal(typeof ps.updateTimeout, 'object', m(scope, `instance.updateTimeout should be an object`))

  t.equal(typeof ps.path === 'string' || ps.path === null, true, m(scope, `instance.path should be a string or \`null\``))

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    ps.preferredErrorLanguage = preferredErrorLanguage

    try {
      ps.isPublicSuffix('')
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `Not-ready error`], e, errorCategory, preferredErrorLanguage})
    }
  }

  ps.preferredErrorLanguage = defaults.publicSuffix.preferredErrorLanguage
}

module.exports = uniformInstanceCreationTests
