#! /usr/local/bin/node
'use strict'

const CookieManager = require('./lib/cookie-manager')
const defaults = require('./data/defaults')
const JettaError = require('./lib/error')
const makeNestedDirectory = require('./lib/make-nested-directory')
const ProgressLogger = require('./lib/progress-logger')
const PublicSuffix = require('./lib/public-suffix')
const request = require('./lib/request')
const urlParser = require('./lib/url-parser')

module.exports = {
  CookieManager,
  defaults,
  JettaError,
  makeNestedDirectory,
  ProgressLogger,
  PublicSuffix,
  request: request.makeRequest,
  requestPromise: request.makeRequestPromise,
  urlParser
}
