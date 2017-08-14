'use strict'

const uniformResultsValidator = require('./uniform-results-validator')

async function generalRequestPromiseTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, generalRequestPromiseTests.name]
  const {jetta, config, errorCategory, ev, servers} = sharedState

  const httpResults = await jetta.requestPromise(null, {requestOptions: {pathname: '/', socketPath: servers.http.basic.address(), protocol: 'http:'}})

  uniformResultsValidator(t, scope, Object.assign({}, sharedState, {results: httpResults}))

  const httpsResults = await jetta.requestPromise(null, {requestOptions: Object.assign({pathname: '/', socketPath: servers.https.basic.address(), protocol: 'https:'}, config.TLSTestCertAndKey)})

  uniformResultsValidator(t, scope, Object.assign({}, sharedState, {results: httpsResults}))

  try {
    await jetta.requestPromise()
    t.fail(`Calling jetta.requestPromise() without options should result in an error`)
  } catch (e) {
    t.pass(`Calling jetta.requestPromise() without options should result in an error`)
  }

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]
    const nestedScope = [`requestPromise error check`, preferredErrorLanguage]

    try {
      await jetta.requestPromise(null, {preferredErrorLanguage})
      t.fail(`Calling jetta.requestPromise() without a valid URL should result in an error`)
    } catch (e) {
      ev({t, scope: nestedScope, e, errorCategory, preferredErrorLanguage})
    }
  }
}

module.exports = generalRequestPromiseTests
