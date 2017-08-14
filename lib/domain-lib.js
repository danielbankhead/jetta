#! /usr/local/bin/node
'use strict'

function domainInOtherDomain (child = '', parent = '') {
  if (typeof child !== 'string' || typeof parent !== 'string' || child === '' || parent === '') {
    return false
  }

  child = child.replace(/^\.+/, '')
  parent = parent.replace(/^\.+/, '')

  if (child === parent) {
    return true
  } else if (child.length > parent.length && child.slice(-(parent.length + 1)) === `.${parent}`) {
    return true
  } else {
    return false
  }
}

module.exports = {
  domainInOtherDomain
}
