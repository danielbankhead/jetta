'use strict'

const sharedConfig = require('../../data/test/shared-config')

const local = {
  shortCacheForImmediateNextTest: 1,
  expectedFilePathKeys: ['lastUpdated', 'list'],
  isPublicSuffixTests: {
    com: true,
    '.......................': false,
    'city.kawasaki.jp': false,
    'not-city.kawasaki.jp': true
  }
}

module.exports = Object.assign({}, sharedConfig, local)
