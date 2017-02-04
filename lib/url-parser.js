#! /usr/local/bin/node
'use strict'

const url = require('url')

const defaults = require('../data/defaults')

function parseURL (candidate, options) {
  let results = {
    isLocalhost: false,
    isValid: false,
    options: Object.assign({}, defaults.urlParser, options),
    parsedURL: null,
    url: ''
  }

  if (typeof candidate === 'string') {
    results.url = url.format(candidate)
    results.parsedURL = url.parse(results.url)
  } else if (typeof candidate === 'object' && typeof candidate.href === 'string') {
    results.url = candidate.href
    if (candidate instanceof url.Url === true) {
      results.parsedURL = candidate
    } else {
      results.parsedURL = url.parse(results.url)
    }
  } else {
    return results
  }

  if (results.parsedURL.slashes === null && results.options.addMissingProtocol === false) {
    return results
  } else if (results.parsedURL.slashes === null && results.options.addMissingProtocol === true) {
    results.url = `${results.options.protocolReplacement}://${results.url.replace(/^\/*/g, '')}`
    results.parsedURL = url.parse(results.url)
  }

  if (results.parsedURL.hostname === null || results.parsedURL.hostname === '') {
    return results
  }

  if (results.parsedURL.hostname === 'localhost' || results.parsedURL.hostname === '::1' || /127.\d.\d.\d/.test(results.parsedURL.hostname) === true) {
    results.isLocalhost = true

    if (results.options.localhostAllowed === false) {
      return results
    }
  } else if (results.parsedURL.hostname.includes('.') === false) {
    return results
  } else if (/(^[.-])|([.-]$)/.test(results.parsedURL.hostname)) {
    // hostname should not start with -. nor end with it
    return results
  }

  results.isValid = true
  return results
}

module.exports = parseURL
