#! /usr/local/bin/node
'use strict'

const fs = require('fs')
const path = require('path')

function makeNestedDirectory (givenPath = '') {
  if (givenPath === '') givenPath = process.cwd()

  if (fs.existsSync(givenPath) === true && fs.statSync(givenPath).isDirectory() === true) {
    return
  }

  try {
    fs.mkdirSync(givenPath)
  } catch (e) {
    const candidatePathDir = path.parse(givenPath).dir

    if (fs.existsSync(candidatePathDir) === false && givenPath !== candidatePathDir) {
      makeNestedDirectory(candidatePathDir)
      fs.mkdirSync(givenPath)
    } else {
      throw e
    }
  }
}

module.exports = makeNestedDirectory
