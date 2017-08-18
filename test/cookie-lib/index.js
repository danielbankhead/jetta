#! /usr/local/bin/node
'use strict'

const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')
const testTools = require('../tools')
const parseCookieTests = require('./parse-cookie')
const parseCookieKVTests = require('./parse-cookie-kv')
const parseSetCookieTests = require('./parse-set-cookie')
const stringifyCookie = require('./stringify-cookie')
const stringifyCookieKV = require('./stringify-cookie-kv')
const stringifySetCookie = require('./stringify-set-cookie')

const m = testTools.generateTestMessage
const ev = testTools.errorVerification
const errorCategory = 'cookie'
const shared = {jetta, config, testTools, errorCategory, m, ev}

tape('cookie-lib', (t) => {
  t.equal(typeof jetta.cookieLib, 'object', `jetta.cookieLib should be a object`)
  t.deepEqual(Object.keys(jetta.cookieLib.safeHTTPMethods), config.safeHTTPMethods, `${config.safeHTTPMethods.join(', ')} should be the only safe HTTP Methods fot cookies`)

  for (let i = 0, len = config.safeHTTPMethods.length; i < len; i++) {
    const method = config.safeHTTPMethods[i]
    t.true(jetta.cookieLib.safeHTTPMethods[method], `jetta.cookieLib.safeHTTPMethods['${method}'] should be \`true\``)
  }

  t.equal(typeof jetta.cookieLib.ParsedCookieHeader, 'function', `ParsedCookieHeader should be a function (class)`)
  t.equal(typeof jetta.cookieLib.ParsedSetCookieHeader, 'function', `ParsedSetCookieHeader should be a function (class)`)

  t.true(jetta.cookieLib.validCookieNameRegex instanceof RegExp, `validCookieNameRegex should be a regular expression`)
  t.true(jetta.cookieLib.validCookieValueRegex instanceof RegExp, `validCookieValueRegex should be a regular expression`)
  t.true(jetta.cookieLib.validPathValueRegex instanceof RegExp, `validPathValueRegex should be a regular expression`)
  t.true(jetta.cookieLib.trailingSemicolonRegex instanceof RegExp, `trailingSemicolonRegex should be a regular expression`)

  t.equal(typeof jetta.cookieLib.parseCookie, 'function', `parseCookie should be a function`)
  t.equal(jetta.cookieLib.parseCookie.length, 0, `parseCookie should have a length of 0 (due to defaults)`)
  t.equal(typeof jetta.cookieLib.parseCookieKV, 'function', `parseCookieKV should be a function`)
  t.equal(jetta.cookieLib.parseCookieKV.length, 0, `parseCookieKV should have a length of 0 (due to defaults)`)
  t.equal(typeof jetta.cookieLib.parseSetCookie, 'function', `parseSetCookie should be a function`)
  t.equal(jetta.cookieLib.parseSetCookie.length, 0, `parseSetCookie should have a length of 0 (due to defaults)`)
  t.equal(typeof jetta.cookieLib.stringifyCookie, 'function', `stringifyCookie should be a function`)
  t.equal(jetta.cookieLib.stringifyCookie.length, 0, `stringifyCookie should have a length of 0 (due to defaults)`)
  t.equal(typeof jetta.cookieLib.stringifyCookieKV, 'function', `stringifyCookieKV should be a function`)
  t.equal(jetta.cookieLib.stringifyCookieKV.length, 0, `stringifyCookieKV should have a length of 0 (due to defaults)`)
  t.equal(typeof jetta.cookieLib.stringifySetCookie, 'function', `stringifySetCookie should be a function`)
  t.equal(jetta.cookieLib.stringifySetCookie.length, 0, `stringifySetCookie should have a length of 0 (due to defaults)`)

  parseCookieTests(t, [], shared)
  parseCookieKVTests(t, [], shared)
  parseSetCookieTests(t, [], shared)
  stringifyCookie(t, [], shared)
  stringifyCookieKV(t, [], shared)
  stringifySetCookie(t, [], shared)

  t.end()
})
