'use strict'

const http = require('http')
const https = require('https')
const os = require('os')
const querystring = require('querystring')
const zlib = require('zlib')

async function serversStart (sharedState = {}) {
  const {jetta, config, b} = sharedState
  const platform = os.platform()
  let {servers} = sharedState

  function generateSocketPath () {
    if (platform === 'win32') {
      return `\\\\.\\pipe\\${b.generate()}`
    } else {
      return `${b.generate()}.sock`
    }
  }

  function getBody (request = {}, callback = () => {}) {
    let chunks = []
    let length = 0

    request.on('data', (data) => {
      chunks[chunks.length] = data
      length += data.length
    }).on('end', () => {
      callback(Buffer.concat(chunks, length))
    })
  }

  await new Promise((resolve, reject) => {
    function isReady () {
      const serversList = Object.keys(servers)

      for (let i = 0, len = serversList.length; i < len; i++) {
        if (servers[serversList[i]].listening === false) {
          return
        }
      }

      resolve()
    }

    function createDualServers (name = '', responseCallback = () => {}) {
      servers.http[name] = http.createServer(responseCallback)
      servers.https[name] = https.createServer(config.TLSTestCertAndKey, responseCallback)

      servers.http[name].listen(generateSocketPath(), isReady)
      servers.https[name].listen(generateSocketPath(), isReady)
    }

    function urlWithoutLeadingSlash (url = '') {
      return url.replace(/^\//, '')
    }

    createDualServers('abort', (req, res) => {
      res.write('should abort...')

      process.nextTick(() => res.destroy())
    })

    createDualServers('basic', (req, res) => {
      res.writeHead(200)
      res.end('ok')
    })

    createDualServers('bodyReflect', (req, res) => {
      getBody(req, (body) => {
        res.writeHead(200, {'Content-Type': 'application/octet-stream'})
        res.end(body)
      })
    })

    createDualServers('contentLength', (req, res) => {
      const [headerValue, send] = urlWithoutLeadingSlash(req.url).split('/')

      res.writeHead(200, {
        'Content-Length': Number(headerValue),
        'Content-Type': 'application/octet-stream'
      })
      res.end(Buffer.alloc(Number(send)))
    })

    createDualServers('cookieReflect', (req, res) => {
      res.writeHead(200, {'Content-Type': 'application/json'})

      let cookieSet = {}

      try {
        cookieSet = jetta.cookieLib.parseCookieKV(req.headers.cookie)
      } catch (e) {}

      res.end(JSON.stringify(cookieSet))
    })

    createDualServers('encoding', (req, res) => {
      getBody(req, (body) => {
        const bodyJSON = JSON.parse(body.toString())
        let output = Buffer.alloc(bodyJSON.alloc, 'test data')

        for (let i = 0, len = bodyJSON.encodings.length; i < len; i++) {
          if (bodyJSON.encodings[i] === 'gzip') {
            output = zlib.gzipSync(output)
          } else if (bodyJSON.encodings[i] === 'deflate') {
            output = zlib.deflateSync(output)
          }
        }

        res.writeHead(200, {'Content-Encoding': bodyJSON.encodings.join(', '), 'Content-Type': 'text/plain'})
        res.end(output)
      })
    })

    createDualServers('encodingUnknown', (req, res) => {
      res.writeHead(200, {'Content-Encoding': 'unknown', 'Content-Type': 'text/plain'})
      res.end(Buffer.alloc(100))
    })

    createDualServers('formReflect', (req, res) => {
      getBody(req, (body) => {
        res.writeHead(200, {'Content-Type': 'application/json'})

        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
          res.end(JSON.stringify(querystring.parse(body.toString())))
        } else {
          res.end('{}')
        }
      })
    })

    createDualServers('json', (req, res) => {
      getBody(req, (body) => {
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(config.httpProtocols.jsonResponse.stringified)
      })
    })

    createDualServers('jsonInvalid', (req, res) => {
      getBody(req, (body) => {
        res.writeHead(200, {'Content-Type': 'application/json'})

        res.end('not-json')
      })
    })

    createDualServers('jsonReflect', (req, res) => {
      getBody(req, (body) => {
        res.writeHead(200, {'Content-Type': 'application/json'})

        if (req.headers['content-type'] === 'application/json') {
          res.end(body)
        } else {
          res.end()
        }
      })
    })

    createDualServers('redirectAbsolute', (req, res) => {
      const pieces = urlWithoutLeadingSlash(req.url).split('/')
      const statusCode = Number(pieces[0])
      const count = Number(pieces[1])
      let protocolNoColon = ''
      let protocolWithColon = ''

      if (pieces[2] !== undefined && pieces[2].length !== 0) {
        protocolNoColon = pieces[2]
        protocolWithColon = `${pieces[2]}:`
      }

      getBody(req, (body) => {
        if (count === 0) {
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({bodyLength: body.length}))
        } else {
          const l = `${protocolWithColon}//localhost/${statusCode}/${count - 1}/${protocolNoColon}`

          res.writeHead(statusCode, {Location: l})
          res.end(req.url)
        }
      })
    })

    createDualServers('redirectAuthorizationReflect', (req, res) => {
      const pieces = urlWithoutLeadingSlash(req.url).split('/')
      const statusCode = Number(pieces[0])
      const initRedirect = pieces[1] === 'init'
      const provideRedirectAuth = pieces[2] === 'provide-redirect-auth'

      getBody(req, (body) => {
        if (initRedirect === false) {
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({headers: req.headers}))
        } else if (provideRedirectAuth === true) {
          res.writeHead(statusCode, {Location: `//${config.httpProtocols.redirectAuthSamples.fromRedirectURLAuthOption}@localhost/`})
          res.end(req.url)
        } else {
          res.writeHead(statusCode, {Location: `/`})
          res.end(req.url)
        }
      })
    })

    createDualServers('redirectHeaderReflect', (req, res) => {
      const pieces = urlWithoutLeadingSlash(req.url).split('/')
      const statusCode = Number(pieces[0])
      const initRedirect = pieces[1] === 'init'
      const localRedirect = (pieces[2] === undefined || pieces[2].length === 0)

      getBody(req, (body) => {
        if (initRedirect === false) {
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({headers: req.headers}))
        } else if (localRedirect === true) {
          res.writeHead(statusCode, {Location: '/'})
          res.end(req.url)
        } else {
          res.writeHead(statusCode, {Location: `//${pieces.slice(2).join('/')}`})
          res.end(req.url)
        }
      })
    })

    createDualServers('redirectRelative', (req, res) => {
      getBody(req, (body) => {
        if (req.headers['x-jetta-test-redirect-relative-init'] !== '1') {
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({bodyLength: body.length, path: req.url}))
        } else {
          const bodyJSON = JSON.parse(body.toString())

          res.writeHead(bodyJSON.statusCode, {Location: bodyJSON.relative})
          res.end(req.url)
        }
      })
    })

    createDualServers('responseCode', (req, res) => {
      res.writeHead(Number(urlWithoutLeadingSlash(req.url)))
      res.end(req.url)
    })

    createDualServers('setCookie', (req, res) => {
      getBody(req, (body) => {
        const bodyJSON = JSON.parse(body.toString())

        res.writeHead(200, {'Set-Cookie': jetta.cookieLib.stringifyCookieKV(bodyJSON).split('; ')})
        res.end('ok')
      })
    })

    createDualServers('setCookieInvalid', (req, res) => {
      res.writeHead(200, {'Set-Cookie': 'invalid-header'})
      res.end('ok')
    })

    createDualServers('socketDestroy', (req, res) => {
      res.destroy()
    })

    createDualServers('timeoutConnect', (req, res) => {
      getBody(req, (body) => {})
    })

    createDualServers('timeoutResponse', (req, res) => {
      res.writeHead(200)
      res.write(req.url)
    })
  })
}

module.exports = serversStart
