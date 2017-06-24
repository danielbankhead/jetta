#! /usr/local/bin/node
'use strict'

const fs = require('fs')
const events = require('events')
const path = require('path')

const defaults = require('../data/defaults')
const JettaError = require('./error')
const makeNestedDirectory = require('./make-nested-directory')
const request = require('./request')

// NOTE: Mention/doc: https://publicsuffix.org/list/ & https://github.com/publicsuffix/list
  // NOTE: cache for up to 24 hours (test)
  // NOTE: can use setupIndex and updateFromSources to manually update
  // NOTE: setupIndex does not update 'lastUpdated'
  // NOTE: can get suffix String via `.list` -> useful for when not using `options.path`
  // NOTE: clearTimeout(publicSuffix.updateTimeout)

  // NOTE: `As a best practice, listeners should always be added for the 'error' events.` - node doc

  // options
    /*
    cacheLimit: NUMBER (in ms) || Infinity
    exceptionsIndex: the index for negations object - will be generated automatically
    index: the index object - will be generated automatically
    lastUpdated: DATE || NUMBER (in ms) (overwritten when reading from file)
      TEST: DATE or NUMBER
      TEST: internally converts to, and uses, a NUMBER
    list STRING || NULL
      if used, will not use nor update path
    path STRING
      if used, will write to file upon updates
      will update 'list' upon parse and updates
    preferredErrorLanguage STRING
    ready: false,
    sources: [
      "https: //publicsuffix.org/list/public_suffix_list.dat",
      "https: //github.com/publicsuffix/list/blob/master/public_suffix_list.dat"
    ],
    updating: false,
    updateTimeout: null

    // jp geographic type names
    // http://jprs.jp/doc/rule/saisoku-1.html
    *.kawasaki.jp
    *.kitakyushu.jp
    *.kobe.jp
    *.nagoya.jp
    *.sapporo.jp
    *.sendai.jp
    *.yokohama.jp
    !city.kawasaki.jp
    !city.kitakyushu.jp
    !city.kobe.jp
    !city.nagoya.jp
    !city.sapporo.jp
    !city.sendai.jp
    !city.yokohama.jp

    */

  // emits
    // 'ready' (no args)
    // 'updatedPublicSuffix' (no args)

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
      if (typeof this.path === 'string') {
        this.path = this.path
      }

      if (fs.existsSync(this.path) === true) {
        const data = JSON.parse(fs.readFileSync(this.path, 'utf8'))

        if (data.lastUpdated > (Date.now() - this.cacheLimit)) {
          this.setupIndex(data.list)
          this.lastUpdated = data.lastUpdated
        }
      } else {
        makeNestedDirectory(path.parse(path.resolve(this.path)).dir)
      }
    }

    if (this.cacheLimit !== Infinity) {
      if (this.lastUpdated > (Date.now() - this.cacheLimit)) {
        this.updateTimeout = setTimeout(this.updateFromSources, this.cacheLimit - (Date.now() - this.lastUpdated))
        process.nextTick(() => this.setReady())
      } else {
        // TEST: init calls should be async, so that the emitters can catch
          // TEST: with immediate error, such as bad URL
            // "https: //publicsuffix.org/list/public_suffix_list.dat",
            // "https: //github.com/publicsuffix/list/blob/master/public_suffix_list.dat"
        process.nextTick(() => this.updateFromSources())
      }
    } else {
      process.nextTick(() => this.setReady())
    }
  }

  setReady () {
    this.ready = true
    this.emit('ready')
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

    this.publicSuffixList = publicSuffixList
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

          if (typeof pathWildCard === 'object' && pathWildCard !== null) {
            pathsToContinue[pathsToContinue.length] = pathWildCard
          }
        }

        exceptionPathsToSearch = pathsToContinue
      }
    }

    return true
  }

  updateFromSources () {
    const ps = this
    const sourceList = ps.sources
    let errors = []

    function resetTimeoutAndMarkAsNotUpdating () {
      ps.updateTimeout = setTimeout(ps.updateFromSources, ps.cacheLimit)
      ps.updating = false
    }

    function pullFromSources (count = 0) {
      request.makeRequest(sourceList[count], {preferredErrorLanguage: ps.preferredErrorLanguage}, (error, results) => {
        if (error !== null) {
          errors[errors.length] = error

          count++

          if (count === sourceList.length) {
            ps.emit('error', new JettaError('jetta-public-suffix-failed-to-update-from-sources', ps.preferredErrorLanguage, errors))
            resetTimeoutAndMarkAsNotUpdating()
          } else {
            pullFromSources(count)
          }
        } else {
          const list = results.data.toString('utf8')

          ps.setupIndex(list)

          if (typeof ps.path === 'string') {
            try {
              fs.writeFileSync(ps.path, JSON.stringify({lastUpdated: ps.lastUpdated, list}))
            } catch (e) {
              // TEST: lastUpdated should not updated on any errors
              ps.emit('error', e)
              resetTimeoutAndMarkAsNotUpdating()
              return
            }
          }

          ps.lastUpdated = Date.now()

          if (ps.ready !== true) {
            ps.setReady()
          } else {
            ps.emit('updatedPublicSuffix')
          }

          resetTimeoutAndMarkAsNotUpdating()
        }
      })
    }

    ps.updating = true

    clearTimeout(ps.updateTimeout)

    if (sourceList instanceof Array === false || sourceList.length === 0) {
      ps.emit('error', new JettaError('jetta-public-suffix-failed-to-update-no-sources', ps.preferredErrorLanguage))
      resetTimeoutAndMarkAsNotUpdating()
    } else {
      pullFromSources()
    }
  }
}

module.exports = PublicSuffixManager
