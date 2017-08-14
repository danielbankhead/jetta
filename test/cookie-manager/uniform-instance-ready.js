'use strict'

const addCookieTests = require('./add-cookie')
const deleteCookieTests = require('./delete-cookie')
const deleteExpiredCookiesTests = require('./delete-expired-cookies')
const deleteSessionCookiesTests = require('./delete-session-cookies')
const generateCookieHeaderTests = require('./generate-cookie-header')
const getCookieTests = require('./get-cookie')
const getCookiesTests = require('./get-cookies')
const validateExport = require('./validate-export')

async function readyTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, 'ready']
  const {config, m, cm, b} = sharedState

  function readyEventFail () {
    t.fail(m(scope, `"ready" event should not be called again`))
  }

  function publicSuffixErrorEventFail (error) {
    t.fail(m(scope, `publicSuffix 'error' should not have been called. Error message: "${error.message}"`))
  }

  function publicSuffixReadyEventFail () {
    t.fail(m(scope, `publicSuffix 'ready' should not have been called`))
  }

  function publicSuffixUpdatedEventFail () {
    t.fail(m(scope, `publicSuffix 'updatedPublicSuffix' should not have been called`))
  }

  cm.on('ready', readyEventFail)

  await new Promise((resolve, reject) => {
    cm.once('updatedPublicSuffix', () => {
      t.pass(m(scope, `"updatedPublicSuffix" should be emitted when internal public suffix has been updated`))
      resolve()
    })
    cm.publicSuffix.updateFromSources()
  })

  await new Promise((resolve, reject) => {
    cm.once('error', (error) => {
      t.pass(m(scope, `"error" should be emitted when internal public suffix has had an error`))
      t.equal(error.code, config.samplePublicSuffixErrorCode, m(scope, `error code should be "${config.samplePublicSuffixErrorCode}" when "error" is emitted from internal public suffix`))
      resolve()
    })

    cm.publicSuffix.emit('error', new Error())
  })

  cm.publicSuffix.on('error', publicSuffixErrorEventFail)
  cm.publicSuffix.on('ready', publicSuffixReadyEventFail)
  cm.publicSuffix.on('updatedPublicSuffix', publicSuffixUpdatedEventFail)

  await addCookieTests(t, scope, sharedState)
  await deleteCookieTests(t, scope, sharedState)
  await deleteExpiredCookiesTests(t, scope, sharedState)
  await deleteSessionCookiesTests(t, scope, sharedState)
  await generateCookieHeaderTests(t, scope, sharedState)
  await getCookieTests(t, scope, sharedState)
  await getCookiesTests(t, scope, sharedState)

  validateExport(t, scope, sharedState)

  const uniqueCookieExportId = `${b.generate()}.com`
  cm.addCookie({name: uniqueCookieExportId, value: uniqueCookieExportId, domain: uniqueCookieExportId})
  t.equal(typeof cm.export().cookies[uniqueCookieExportId], 'object', m(scope, `.export() should contain session cookies`))

  await new Promise((resolve, reject) => process.nextTick(resolve))

  cm.removeListener('ready', readyEventFail)
  cm.publicSuffix.removeListener('error', publicSuffixErrorEventFail)
  cm.publicSuffix.removeListener('ready', publicSuffixReadyEventFail)
  cm.publicSuffix.removeListener('updatedPublicSuffix', publicSuffixUpdatedEventFail)
}

module.exports = readyTests
