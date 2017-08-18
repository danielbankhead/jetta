#! /usr/local/bin/node
'use strict'

const cookieLib = require('./lib/cookie-lib')
const CookieManager = require('./lib/cookie-manager')
const defaults = require('./data/defaults')
const domainLib = require('./lib/domain-lib')
const JettaError = require('./lib/jetta-error')
const makeNestedDirectory = require('./lib/make-nested-directory')
const PublicSuffix = require('./lib/public-suffix')
const request = require('./lib/request')
const urlParser = require('./lib/url-parser')

module.exports = {
  cookieLib,
  CookieManager: CookieManager.CookieManager,
  CookieManagerCookie: CookieManager.CookieManagerCookie,
  defaults,
  domainLib,
  JettaError,
  makeNestedDirectory,
  PublicSuffix,
  request: request.makeRequest,
  requestPromise: request.makeRequestPromise,
  urlParser
}
