#! /usr/local/bin/node
'use strict'

const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')
const testTools = require('../tools')

const m = testTools.generateTestMessage

tape('domain-lib', (t) => {
  t.equal(typeof jetta.domainLib, 'object', `jetta.domainLib should be a object`)
  t.equal(typeof jetta.domainLib.domainInOtherDomain, 'function', `jetta.domainLib.domainInOtherDomain should be a function`)
  t.equal(jetta.domainLib.domainInOtherDomain.length, 0, `jetta.domainLib.domainInOtherDomain should have a length of 0 (due to defaults)`)

  for (let i = 0, len = config.domainInOtherDomain.shouldBeFalse.length; i < len; i++) {
    const group = config.domainInOtherDomain.shouldBeFalse[i]

    t.false(jetta.domainLib.domainInOtherDomain(group[0], group[1]), m([group], `should be \`false\``))
  }

  for (let i = 0, len = config.domainInOtherDomain.shouldBeTrue.length; i < len; i++) {
    const group = config.domainInOtherDomain.shouldBeTrue[i]

    t.true(jetta.domainLib.domainInOtherDomain(group[0], group[1]), m([group], `should be \`true\``))
  }

  t.end()
})
