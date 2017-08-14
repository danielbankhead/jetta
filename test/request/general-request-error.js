'use strict'

const events = require('events')

const uniformResultsExecutor = require('./uniform-results-executor')

async function generalRequestErrorTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, generalRequestErrorTests.name]
  const {jetta, m, servers} = sharedState

  class ServerAbort extends events {
    abort () {}
    end () {
      this.emit('aborted')
    }
    setTimeout () {}
    write () {}
  }

  class ResponseError extends events {
    constructor () {
      super()

      this.headers = {}
      this.statusCode = 200
    }
  }

  class RequestForResponseError extends events {
    abort () {}
    end () {
      const responseInstance = new ResponseError()

      this.emit('response', responseInstance)

      process.nextTick(() => responseInstance.emit('error', new Error()))
    }
    setTimeout () {}
    write () {}
  }

  const noArgs = {requestParams: {expectedOK: false}}
  const badProtocol = {
    requestParams: {
      expectedOK: false,
      options: {
        requestOptions: {
          pathname: '/',
          socketPath: servers.http.basic.address(),
          protocol: 'some-unknown-protocol:'
        }
      }
    }
  }
  const badURL = {
    requestParams: {
      expectedOK: false,
      options: {
        requestOptions: {
          socketPath: servers.http.basic.address()
        }
      },
      url: '?'
    }
  }
  const forceAbortServer = {
    requestParams: {
      expectedOK: false,
      options: {
        engines: {
          'http:': () => new ServerAbort()
        },
        requestOptions: {
          socketPath: servers.http.basic.address(),
          pathname: '/',
          protocol: 'http:'
        }
      }
    }
  }
  const forceResponseError = {
    requestParams: {
      expectedOK: false,
      options: {
        engines: {
          'http:': () => new RequestForResponseError()
        },
        requestOptions: {
          socketPath: servers.http.basic.address(),
          pathname: '/',
          protocol: 'http:'
        }
      }
    }
  }

  try {
    jetta.request()
    t.pass(m(scope, 'Should silently fail when called w/o params (since default callback is provided)'))
  } catch (e) {
    t.fail(m(scope, 'Should silently fail when called w/o params (since default callback is provided)'))
  }

  await uniformResultsExecutor(t, [...scope, 'no arguments'], Object.assign({}, sharedState, noArgs))
  await uniformResultsExecutor(t, [...scope, 'bad URL'], Object.assign({}, sharedState, badURL))
  await uniformResultsExecutor(t, [...scope, 'bad protocol'], Object.assign({}, sharedState, badProtocol))
  await uniformResultsExecutor(t, [...scope, 'server aborted request'], Object.assign({}, sharedState, forceAbortServer))
  await uniformResultsExecutor(t, [...scope, 'request response error'], Object.assign({}, sharedState, forceResponseError))
}

module.exports = generalRequestErrorTests
