'use strict'

async function serversShutdown (sharedState = {}) {
  const {testTools, servers} = sharedState
  const httpServerNames = Object.keys(servers.http)
  const httpsServerNames = Object.keys(servers.https)

  for (let i = 0, len = httpServerNames.length; i < len; i++) {
    await new Promise((resolve, reject) => {
      const socketFile = servers.http[httpServerNames[i]].address()

      servers.http[httpServerNames[i]].close(() => {
        testTools.cleanupFiles(socketFile)
        resolve()
      })
    })
  }

  for (let i = 0, len = httpsServerNames.length; i < len; i++) {
    await new Promise((resolve, reject) => {
      const socketFile = servers.https[httpsServerNames[i]].address()

      servers.https[httpsServerNames[i]].close(() => {
        testTools.cleanupFiles(socketFile)
        resolve()
      })
    })
  }
}

module.exports = serversShutdown
