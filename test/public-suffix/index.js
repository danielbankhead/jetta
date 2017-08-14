#! /usr/local/bin/node
'use strict'

const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')
const defaults = require('../../data/defaults')
const testTools = require('../tools')

const instanceCacheInfinityTests = require('./instance-cache-infinity')
const instanceCacheInfinityNoExistingPathTests = require('./instance-cache-infinity-no-existing-path')
const instanceDefaultTests = require('./instance-default')
const instanceFromDefaultPathTests = require('./instance-from-default-path')
const instanceInvalidSourcesTests = require('./instance-invalid-sources')
const instanceListCacheInfinityTests = require('./instance-list-cache-infinity')
const instanceListCacheInfinityNonEmptyTests = require('./instance-list-cache-infinity-non-empty')
const instanceListTests = require('./instance-list')
const instanceListOverwriteLastedUpdatedTests = require('./instance-list-overwrite-date')
const instanceOverwriteLastUpdatedTests = require('./instance-overwrite-date')
const instancePathListExpiredTests = require('./instance-path-list-expired')

const m = testTools.generateTestMessage
const ev = testTools.errorVerification
const errorCategory = 'public-suffix'
let shared = {jetta, config, defaults, testTools, errorCategory, m, ev}

tape('public-suffix', {timeout: 60 * 1000}, (t) => {
  async function asyncTests () {
    t.equal(typeof jetta.PublicSuffix, 'function', `jetta.PublicSuffix should be a function (class)`)

    await testTools.prepareCachedDefaultPublicSuffixList(shared.defaults)
    testTools.cleanupFiles(defaults.publicSuffix.path)

    await instanceDefaultTests(t, [], shared)
    await instanceFromDefaultPathTests(t, [], shared)
    await instanceOverwriteLastUpdatedTests(t, [], shared)
    await instancePathListExpiredTests(t, [], shared)
    await instanceCacheInfinityTests(t, [], shared)

    testTools.cleanupFiles(defaults.publicSuffix.path)

    await instanceCacheInfinityNoExistingPathTests(t, [], shared)
    await instanceListTests(t, [], shared)

    testTools.cleanupFiles(defaults.publicSuffix.path)

    await instanceListOverwriteLastedUpdatedTests(t, [], shared)
    await instanceListCacheInfinityTests(t, [], shared)
    await instanceListCacheInfinityNonEmptyTests(t, [], shared)
    await instanceInvalidSourcesTests(t, [], shared)

    testTools.cleanupFiles(defaults.publicSuffix.path)

    t.end()
  }

  asyncTests()
})
