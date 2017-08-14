#! /usr/local/bin/node
'use strict'

const tape = require('tape')

const jetta = require('../../')
const config = require('./.config')

tape('jetta-error', (t) => {
  t.equal(typeof jetta.JettaError, 'function', `JettaError should be a function`)
  t.equal(typeof jetta.JettaError.getErrorMessage, 'function', `JettaError.getErrorMessage should be a function`)

  t.throws(() => new jetta.JettaError(), `new instance (no arguments) should throw an error`)
  t.throws(jetta.JettaError.getErrorMessage, `\`JettaError.getErrorMessage()\` (no arguments) should throw an error`)

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    try {
      jetta.JettaError.getErrorMessage('', preferredErrorLanguage)
      throw new Error()
    } catch (e) {
      t.true(e.message.includes(`[lang: "${preferredErrorLanguage}"]`), `JettaError.getErrorMessage with an invalid code should contain \`[lang: "${preferredErrorLanguage}"]\``)
    }

    try {
      jetta.JettaError.getErrorMessage('', preferredErrorLanguage, {})
      throw new Error()
    } catch (e) {
      t.true(e.message.includes(`[lang: "${preferredErrorLanguage}"]`), `JettaError.getErrorMessage with an invalid code and valid details Object should contain \`[lang: "${preferredErrorLanguage}"]\``)
    }
  }

  t.end()
})
