'use strict'

const events = require('events')

function uniformInstanceCreationTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformInstanceCreationTests.name]
  const {jetta, config, errorCategory, m, ev, cm} = sharedState
  const cachedpreferredErrorLanguage = cm.preferredErrorLanguage

  t.equal(cm.ready, false, m(scope, `instance should not be ready syncronously/immediately upon creation`))
  t.true(cm instanceof events, m(scope, `instance should be an instance of events`))

  t.equal(typeof cm.handlePublicSuffixError, 'function', m(scope, `instance should have a "handlePublicSuffixError" method`))
  t.equal(typeof cm.handleUpdatedPublicSuffix, 'function', m(scope, `instance should have a "handleUpdatedPublicSuffix" method`))
  t.equal(typeof cm.destroy, 'function', m(scope, `instance should have a "destroy" method`))
  t.equal(typeof cm.export, 'function', m(scope, `instance should have a "export" method`))
  t.equal(typeof cm.addCookie, 'function', m(scope, `instance should have a "addCookie" method`))
  t.equal(typeof cm.deleteCookie, 'function', m(scope, `instance should have a "deleteCookie" method`))
  t.equal(typeof cm.deleteExpiredCookies, 'function', m(scope, `instance should have a "deleteExpiredCookies" method`))
  t.equal(typeof cm.deleteSessionCookies, 'function', m(scope, `instance should have a "deleteSessionCookies" method`))
  t.equal(typeof cm.generateCookieHeader, 'function', m(scope, `instance should have a "generateCookieHeader" method`))
  t.equal(typeof cm.getCookie, 'function', m(scope, `instance should have a "getCookie" method`))
  t.equal(typeof cm.getCookies, 'function', m(scope, `instance should have a "getCookies" method`))
  t.equal(typeof cm.setReady, 'function', m(scope, `instance should have a "setReady" method`))

  t.equal(typeof cm.cookies, 'object', m(scope, `instance should have a "cookies" object`))
  t.notEqual(cm.cookies, null, m(scope, `".cookies" should not be \`null\``))
  t.equal(typeof cm.maxCookieByteLength, 'number', m(scope, `"maxCookieByteLength" should be a number`))
  t.equal(typeof cm.maxCookies, 'number', m(scope, `"maxCookies" should be a number`))
  t.equal(typeof cm.maxCookiesPerDomain, 'number', m(scope, `"maxCookiesPerDomain" should be a number`))
  t.equal(typeof cm.publicSuffix, 'object', m(scope, `instance should have a "publicSuffix" object`))
  t.notEqual(cm.publicSuffix, null, m(scope, `".publicSuffix" should not be \`null\``))
  t.true(cm.publicSuffix instanceof jetta.PublicSuffix, m(scope, `".publicSuffix" should be an instance of jetta.PublicSuffix`))
  t.equal(typeof cm.publicSuffixOptions, 'object', m(scope, `instance should have a "publicSuffixOptions" object`))
  t.equal(typeof cm.preferredErrorLanguage, 'string', m(scope, `"preferredErrorLanguage" should be a string`))
  t.equal(typeof cm.ready, 'boolean', m(scope, `"ready" should be a boolean`))
  t.equal(cm.ready, false, m(scope, `"ready" should be false`))

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]
    let errorFired = false

    cm.preferredErrorLanguage = preferredErrorLanguage

    cm.once('error', (e) => {
      if (e.details.code === config.samplePublicSuffixErrorCode) {
        errorFired = true
        ev({t, scope: [...scope, `public suffix error check`], e, errorCategory, preferredErrorLanguage})
      }
    })

    const psEmitError = new Error(config.samplePublicSuffixErrorEmitMessage)
    psEmitError.code = config.samplePublicSuffixErrorCode

    cm.publicSuffix.emit('error', psEmitError)

    if (errorFired === false) {
      t.fail(m(scope, `cookie manager should be listening to public suffix's error event (lang = ${preferredErrorLanguage})`))
    }

    errorFired = false
    const handlePublicSuffixErrorMessage = 'cookie manager should emit "error" for handlePublicSuffixError()'

    cm.once('error', (e) => {
      errorFired = true
      t.pass(m(scope, handlePublicSuffixErrorMessage))
    })

    cm.handlePublicSuffixError()

    if (errorFired === false) {
      t.fail(m(scope, handlePublicSuffixErrorMessage))
    }
  }

  cm.preferredErrorLanguage = cachedpreferredErrorLanguage
}

module.exports = uniformInstanceCreationTests
