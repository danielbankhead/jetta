#! /usr/local/bin/node
'use strict'

const net = require('net')
const url = require('url')

const defaults = require('../data/defaults')
const dotOrDashAtBeginningOrEndRegex = /(^[.-])|([.-]$)/
const doubleDashOrDotRegex = /[.-][.-]/
const leadingSlashesRegex = /^\/*/
const punycodeDomainSegmentRegex = /^xn--/

function parseURL (candidate = null, options = {}, missingProtocolAdded = false) {
  let results = {
    isLocalhost: false,
    isValid: false,
    options: Object.assign({}, defaults.urlParser, options),
    parsedURL: null,
    url: ''
  }

  if (typeof candidate === 'string') {
    candidate = candidate.trim()

    if (/\s/.test(candidate) === true && results.options.allowWhitespaceBeforeFormatting === false) {
      return results
    }
  }

  try {
    results.url = url.format(candidate)
  } catch (e) {
    return results
  }

  results.parsedURL = url.parse(results.url)

  if (results.parsedURL.protocol === 'data:' || results.parsedURL.protocol === 'file:') {
    results.isValid = true
    if (results.options.protocolsAllowed !== null) {
      if (results.options.protocolsAllowed[results.parsedURL.protocol] === true) {
        results.isValid = true
      } else {
        results.isValid = false
      }
    }
    return results
  }

  if (results.parsedURL.protocol === null) {
    if (results.options.addMissingProtocol === true && missingProtocolAdded === false) {
      return parseURL(url.format(`${results.options.protocolReplacement}//${results.url.replace(leadingSlashesRegex, '')}`), options, true)
    } else {
      return results
    }
  }

  if (results.parsedURL.hostname === null || results.parsedURL.hostname === '') {
    return results
  }

  if (results.options.protocolsAllowed !== null && results.options.protocolsAllowed[results.parsedURL.protocol] !== true) {
    return results
  }

  if (results.options.ipAddressesAllowed === false) {
    if (net.isIP(results.parsedURL.hostname) === true || /^\d+$/.test(results.parsedURL.hostname.replace(/[:.[\]]/g, '')) === true) {
      return results
    }
  }

  if (results.parsedURL.hostname === 'localhost' || results.parsedURL.hostname === '::1' || /127.\d.\d.\d/.test(results.parsedURL.hostname) === true) {
    results.isLocalhost = true

    if (results.options.localhostAllowed === false) {
      return results
    }
  } else if (dotOrDashAtBeginningOrEndRegex.test(results.parsedURL.hostname) === true) {
    return results
  }

  const hostnamePieces = results.parsedURL.hostname.split('.')

  for (let i = 0, len = hostnamePieces.length; i < len; i++) {
    const segment = hostnamePieces[i]
    if (punycodeDomainSegmentRegex.test(segment) === false && (doubleDashOrDotRegex.test(segment) === true || dotOrDashAtBeginningOrEndRegex.test(segment) === true)) {
      return results
    }
  }

  results.isValid = true
  return results
}

module.exports = parseURL
