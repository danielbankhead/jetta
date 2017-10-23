'use strict'

const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')

const sharedConfig = require('../../data/test/shared-config')

let customEngines = []

try {
  customEngines = require('../../tools/.test-request-custom-engines.js')
} catch (e) {}

const local = {
  TLSTestCertAndKey: {
    cert: fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'test', 'tls-cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'test', 'tls-priv.pem'))
  },
  dataProtocol: {
    invalid: [
      'data:',
      'data:invalid',
      'data:invalid/',
      'data:,%Z'
    ],
    valid: [
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:,example%20text'
      },
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:;base64,ZXhhbXBsZSB0ZXh0'
      },
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:text/plain;charset=US-ASCII,example%20text'
      },
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:text/plain;charset=US-ASCII;base64,ZXhhbXBsZSB0ZXh0'
      },
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:;charset=US-ASCII,example%20text'
      },
      {
        'content-type': 'text/plain;charset=US-ASCII',
        'expected': Buffer.from('example text'),
        'uri': 'data:;charset=US-ASCII;base64,ZXhhbXBsZSB0ZXh0'
      },
      {
        'content-type': 'text/plain',
        'expected': Buffer.from('example text'),
        'uri': 'data:text/plain,example%20text'
      },
      {
        'content-type': 'text/plain',
        'expected': Buffer.from('example text'),
        'uri': 'data:text/plain;base64,ZXhhbXBsZSB0ZXh0'
      }
    ],
    jsonExample: {
      'expected': Buffer.from(JSON.stringify({'example': 'text'})),
      'uri': 'data:application/json;base64,eyJleGFtcGxlIjoidGV4dCJ9'
    },
    sharedOptionsParams: {
      testURL: 'data:application/json;base64,eyJleGFtcGxlIjoidGV4dCJ9',
      sha384Base64Checksum: '3RCuY/WGUuzb3BUedwBRFOgJ4KmYRftgaG9KBBEwuwdCuO0YKuqEF8CT4jMo0tjt'
    }
  },
  httpProtocols: {
    agents: {
      'http:': Object.assign(new http.Agent({keepAlive: true}), {fromAgents: true}),
      'https:': Object.assign(new https.Agent({keepAlive: true}), {fromAgents: true})
    },
    agentsManual: {
      'http:': new http.Agent({keepAlive: true}),
      'https:': new https.Agent({keepAlive: true})
    },
    badResponseCodes: [
      300,
      301,
      400,
      401,
      500,
      501
    ],
    bodyExample: Buffer.from('example'),
    contentEncodingAllocation: 1024,
    externalRedirectURL: 'github.com/AltusAero/jetta',
    formExample: {
      name: 'Dan',
      email: 'dan@example.com'
    },
    jsonExample: {
      name: 'Dan',
      email: 'dan@example.com',
      nestedObject: {
        example: [
          1,
          2,
          3,
          null
        ]
      }
    },
    jsonResponse: {
      stringified: JSON.stringify({some: {json: 1}})
    },
    readableStreamFilePath: path.join(__dirname, '..', '..', 'README.md'),
    redirectAuthSamples: {
      fromOriginalURLAuthOption: 'test:fromOriginalURLAuthOption',
      fromOriginalURLHeader: 'test:fromOriginalURLHeader',
      fromRedirectURLAuthOption: 'test:fromRedirectURLAuthOption'
    },
    relativeRedirects: [
      {
        from: '/',
        relative: 'example',
        expected: '/example'
      },
      {
        from: '/',
        relative: './example',
        expected: '/example'
      },
      {
        from: '/',
        relative: '../example',
        expected: '/example'
      },
      {
        from: '/nested/path',
        relative: 'example',
        expected: '/nested/example'
      },
      {
        from: '/nested/path',
        relative: './example',
        expected: '/nested/example'
      },
      {
        from: '/nested/path',
        relative: '../example',
        expected: '/example'
      },
      {
        from: '/nested/path',
        relative: '../example/nested/path',
        expected: '/example/nested/path'
      },
      {
        from: '/nested/path/deep',
        relative: '../example/nested/path',
        expected: '/nested/example/nested/path'
      },
      {
        from: '/nested/path/deep/a/b/c/d/e/f/g/h',
        relative: './../',
        expected: '/nested/path/deep/a/b/c/d/e/f/'
      },
      {
        from: '/nested/path/deep/a/b/c/d/e/f/g/h',
        relative: './../example',
        expected: '/nested/path/deep/a/b/c/d/e/f/example'
      },
      {
        from: '/nested/path/deep/a/b/c/d/e/f/g/h',
        relative: './../../../../../../../../../../../../../../../../../../',
        expected: '/'
      }
    ]
  },
  sharedOptions: {
    checksumAlgorithms: [
      'sha224',
      'sha256',
      'sha384',
      'sha512'
    ]
  }
}

const enginesList = [
  {
    name: 'default',
    engines: {
      'http:': http.request,
      'https:': https.request
    },
    start: async () => {},
    shutdown: async () => {}
  },
  ...customEngines
]

module.exports = Object.assign({}, sharedConfig, local, {enginesList})
