#! /usr/local/bin/node
'use strict'

const fs = require('fs')
const events = require('events')
const path = require('path')

const defaults = require('../data/defaults')
const JettaError = require('./jetta-error')
const makeNestedDirectory = require('./make-nested-directory')
const request = require('./request')

class PublicSuffixManager extends events {
  constructor (options = {}) {
    super()

    Object.assign(this, defaults.publicSuffix, options)

    if (this.lastUpdated instanceof Date) {
      this.lastUpdated = this.lastUpdated.valueOf()
    }

    if (typeof this.list === 'string') {
      this.setupIndex(this.list)
      this.path = null
    } else {
      if (fs.existsSync(this.path) === true) {
        const data = JSON.parse(fs.readFileSync(this.path, 'utf8'))

        if (this.cacheLimit === Infinity || (data.lastUpdated > (Date.now() - this.cacheLimit))) {
          this.setupIndex(data.list)
          this.lastUpdated = data.lastUpdated
        }
      } else {
        makeNestedDirectory(path.parse(path.resolve(this.path)).dir)
      }
    }

    if (this.cacheLimit !== Infinity) {
      if (this.lastUpdated > (Date.now() - this.cacheLimit)) {
        this.updateTimeout = setTimeout(this.updateFromSources.bind(this), this.cacheLimit - (Date.now() - this.lastUpdated))
        this.setReady()
      } else {
        this.updateFromSources()
      }
    } else {
      if (typeof this.list !== 'string' || this.list === '') {
        this.updateFromSources()
      } else {
        this.setReady()
      }
    }
  }

  destroy () {
    clearTimeout(this.updateTimeout)
    const keys = Object.keys(this)

    for (let i = 0, len = keys.length; i < len; i++) {
      this[keys[i]] = null
    }
  }

  setReady () {
    process.nextTick(() => {
      this.ready = true
      this.emit('ready')
    })
  }

  setupIndex (list = '') {
    const publicSuffixLines = list.split('\n')
    let publicSuffixList = []

    this.index = {}
    this.exceptionsIndex = {}

    for (let i = 0, len = publicSuffixLines.length; i < len; i++) {
      const line = publicSuffixLines[i].trim()

      if (line !== '' && line.slice(0, 2) !== '//') {
        publicSuffixList[publicSuffixList.length] = line
      }
    }

    for (let i = 0, len = publicSuffixList.length; i < len; i++) {
      let ruleToUse = publicSuffixList[i]
      let use = this.index
      let segment = null
      let parent = null
      let pieces = []

      if (publicSuffixList[i][0] === '!') {
        use = this.exceptionsIndex
        ruleToUse = publicSuffixList[i].slice(1)
      }

      pieces = ruleToUse.split('.')
      segment = use[pieces.length]

      if (segment === undefined) {
        use[pieces.length] = {}
        segment = use[pieces.length]
      }

      for (let j = 0, jLen = pieces.length; j < jLen; j++) {
        const isLast = j + 1 === jLen
        const piece = pieces[j]

        if (parent === null) {
          if (segment[piece] === undefined) {
            if (isLast) {
              segment[piece] = true
            } else {
              segment[piece] = {}
            }
          }
          parent = segment[piece]
        } else {
          if (parent[piece] === undefined) {
            if (isLast) {
              parent[piece] = true
            } else {
              parent[piece] = {}
            }
          }
          parent = parent[piece]
        }
      }
    }

    this.list = list
  }

  isPublicSuffix (hostname = '') {
    if (this.ready === false) {
      throw new JettaError('jetta-public-suffix-not-ready', this.preferredErrorLanguage)
    }

    if (typeof hostname !== 'string') {
      return false
    }

    const pieces = hostname.split('.')

    if (typeof this.index[pieces.length] !== 'object') {
      return false
    }

    let pathsToSearch = [this.index[pieces.length]]

    for (let i = 0, len = pieces.length; i < len; i++) {
      let pathsToContinue = []
      let foundMatch = false
      for (let j = 0, jLen = pathsToSearch.length; j < jLen; j++) {
        const pathToSearch = pathsToSearch[j]
        const pathStrict = pathToSearch[pieces[i]]
        const pathWildCard = pathToSearch['*']

        if (pathStrict === true || pathWildCard === true) {
          foundMatch = true
          break
        }

        if (typeof pathStrict === 'object' && pathStrict !== null) {
          pathsToContinue[pathsToContinue.length] = pathStrict
        }

        if (typeof pathWildCard === 'object' && pathWildCard !== null) {
          pathsToContinue[pathsToContinue.length] = pathWildCard
        }
      }

      if (foundMatch === true) {
        break
      } else if (pathsToContinue.length === 0) {
        return false
      } else {
        pathsToSearch = pathsToContinue
      }
    }

    let exceptionPathsToSearch = [this.exceptionsIndex[pieces.length]]

    if (this.exceptionsIndex[pieces.length] !== undefined) {
      for (let i = 0, len = pieces.length; i < len; i++) {
        let pathsToContinue = []
        for (let j = 0, jLen = exceptionPathsToSearch.length; j < jLen; j++) {
          const pathToSearch = exceptionPathsToSearch[j]
          const pathStrict = pathToSearch[pieces[i]]
          const pathWildCard = pathToSearch['*']

          if (pathStrict === true || pathWildCard === true) {
            return false
          }

          if (typeof pathStrict === 'object' && pathStrict !== null) {
            pathsToContinue[pathsToContinue.length] = pathStrict
          }
        }

        exceptionPathsToSearch = pathsToContinue
      }
    }

    return true
  }

  updateFromSources () {
    const ps = this
    let errors = []
    let sourceList = []

    function resetTimeoutAndMarkAsNotUpdating () {
      if (ps.cacheLimit !== Infinity) {
        ps.updateTimeout = setTimeout(ps.updateFromSources.bind(ps), ps.cacheLimit)
      }
      ps.updating = false
    }

    function pullFromSources (count = 0) {
      request.makeRequest(sourceList[count], {preferredErrorLanguage: ps.preferredErrorLanguage}, (error, results) => {
        if (error !== null) {
          errors[errors.length] = {error, source: sourceList[count]}

          count++

          if (count === sourceList.length) {
            ps.emit('error', new JettaError('jetta-public-suffix-failed-to-update-from-sources', ps.preferredErrorLanguage, errors))
            resetTimeoutAndMarkAsNotUpdating()
          } else {
            pullFromSources(count)
          }
        } else {
          const list = results.data.toString('utf8')
          const lastUpdated = Date.now()

          ps.setupIndex(list)

          if (ps.path !== null) {
            try {
              fs.writeFileSync(ps.path, JSON.stringify({lastUpdated, list}))
            } catch (e) {
              ps.emit('error', new JettaError('jetta-public-suffix-failed-to-write-file', ps.preferredErrorLanguage, e))
              resetTimeoutAndMarkAsNotUpdating()
              return
            }
          }

          ps.lastUpdated = lastUpdated

          resetTimeoutAndMarkAsNotUpdating()

          if (ps.ready !== true) {
            ps.setReady()
          } else {
            ps.emit('updatedPublicSuffix')
          }
        }
      })
    }

    ps.updating = true

    clearTimeout(ps.updateTimeout)

    if (ps.sources instanceof Array === false) {
      ps.emit('error', new JettaError('jetta-public-suffix-failed-to-update-no-sources', ps.preferredErrorLanguage))
      resetTimeoutAndMarkAsNotUpdating()
    }

    sourceList = Array.from(ps.sources)

    if (sourceList.length === 0) {
      ps.emit('error', new JettaError('jetta-public-suffix-failed-to-update-no-sources', ps.preferredErrorLanguage))
      resetTimeoutAndMarkAsNotUpdating()
    } else {
      process.nextTick(pullFromSources)
    }
  }
}

module.exports = PublicSuffixManager
