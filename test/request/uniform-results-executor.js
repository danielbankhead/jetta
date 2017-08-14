'use strict'

const uniformResultsValidator = require('./uniform-results-validator')

async function uniformResultsExecutor (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, uniformResultsExecutor.name]
  const {jetta, config, errorCategory, m, ev, requestParams} = sharedState
  const rExpectedOK = requestParams.expectedOK
  const rState = requestParams.state
  const rURL = requestParams.url

  let cachedInputOptions
  let cachedInputURL
  let callCount = 0
  let rOptions = requestParams.options
  let resultsToReturn = null

  function wasCalledAsyncCheck (wasCalledAsync = true, localScope = []) {
    t.true(wasCalledAsync, m(localScope, `was called asyncronously`))
  }

  function mutatedCheck (url, options, cachedURL, cachedOptions, localScope = []) {
    let useOptions
    let useCachedOptions

    switch (typeof options) {
      case 'undefined':
        useOptions = undefined
        break
      case 'string':
        useOptions = options
        break
      default:
        if (options === null) {
          useOptions = null
        } else {
          useOptions = Object.assign({}, options, {cookieManager: null})
        }
    }

    switch (typeof cachedOptions) {
      case 'undefined':
        useCachedOptions = undefined
        break
      case 'string':
        useCachedOptions = cachedOptions
        break
      default:
        if (cachedOptions === null) {
          useCachedOptions = null
        } else {
          useCachedOptions = Object.assign({}, cachedOptions, {cookieManager: null})
        }
    }

    t.deepEqual(url, cachedURL, m(localScope, `request should not mutate given URLs`))
    t.deepEqual(useOptions, useCachedOptions, m(localScope, `request should not mutate given options`))
  }

  switch (typeof rOptions) {
    case 'undefined':
      cachedInputOptions = undefined
      break
    case 'string':
      cachedInputOptions = rOptions
      break
    default:
      if (rOptions === null) {
        cachedInputOptions = null
      } else {
        cachedInputOptions = Object.assign({}, rOptions)
      }
  }

  switch (typeof rURL) {
    case 'undefined':
      cachedInputURL = undefined
      break
    case 'string':
      cachedInputURL = rURL
      break
    default:
      if (rURL === null) {
        cachedInputURL = null
      } else {
        cachedInputURL = Object.assign({}, rURL)
      }
  }

  Object.freeze(cachedInputOptions)
  Object.freeze(cachedInputURL)

  if (rExpectedOK === true) {
    resultsToReturn = await new Promise((resolve, reject) => {
      let wasCalledAsync = false

      function okRequestResults (error, results) {
        wasCalledAsyncCheck(wasCalledAsync, scope)
        mutatedCheck(rURL, rOptions, cachedInputURL, cachedInputOptions, scope)

        callCount++

        t.equal(error, null, m(scope, `error should be \`null\``))

        if (callCount > 1) {
          t.fail(m(scope, `called more than once`))
        }

        resolve(results)
      }

      if (rOptions === undefined) {
        jetta.request(rURL, okRequestResults, rState)
      } else {
        jetta.request(rURL, rOptions, okRequestResults, rState)
      }

      wasCalledAsync = true
    })
  } else {
    for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
      const preferredErrorLanguage = config.currentAvailableLangs[i]
      const nestedScope = [...scope, `request error check`, preferredErrorLanguage]
      let optionsWasNotValidObject = false

      if (typeof rOptions !== 'object' || rOptions === null) {
        optionsWasNotValidObject = true

        rOptions = {}
        cachedInputOptions = {}
      }

      rOptions.preferredErrorLanguage = preferredErrorLanguage
      cachedInputOptions = Object.assign({}, cachedInputOptions, {preferredErrorLanguage})

      Object.freeze(cachedInputOptions)

      resultsToReturn = await new Promise((resolve, reject) => {
        let wasCalledAsync = false

        jetta.request(rURL, rOptions, (error, results) => {
          wasCalledAsyncCheck(wasCalledAsync, nestedScope)
          mutatedCheck(rURL, rOptions, cachedInputURL, cachedInputOptions, nestedScope)

          callCount++

          if (error === null || results.error === null) {
            t.fail(m(nestedScope, `expected error response`))
          } else if (callCount === 1) {
            ev({t, scope: nestedScope, e: error, errorCategory, preferredErrorLanguage})
          } else {
            t.fail(m(nestedScope, `called more than once`))
          }

          resolve(results)
        }, rState)

        wasCalledAsync = true
      })

      if (optionsWasNotValidObject === true) {
        rOptions = null
      }
    }
  }

  uniformResultsValidator(t, scope, Object.assign({}, sharedState, {results: resultsToReturn}))

  return resultsToReturn
}

module.exports = uniformResultsExecutor
