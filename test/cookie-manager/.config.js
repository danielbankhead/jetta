'use strict'

const sharedConfig = require('../../data/test/shared-config')

const local = {
  addCookieStrings: {
    invalid: [
      [';'],
      ['example'],
      ['ø=this'],
      ['test=ø'],
      ['n=v;expires'],
      ['n=v; Expires='],
      ['n=v; Expires=apple'],
      ['n=v; Expires=Tue, 27 Jun 2017 01:50:08 GMT;', {allowExpiredSetCookie: false}],
      ['n=v;max-Age'],
      ['n=v; Max-Age='],
      ['n=v; Max-Age=apple'],
      ['n=v; Max-Age=0', {allowExpiredSetCookie: false}],
      ['n=v; Max-Age=-1', {allowExpiredSetCookie: false}],
      ['n=v;domain'],
      ['n=v; Domain='],
      ['n=v; Domain=some--invalid--domain.com'],
      ['n=v;path'],
      ['n=v; Path=\b'],
      ['n=v; Secure='],
      ['n=v; Secure=yes'],
      ['n=v; Secure', {isSecureEnv: false}],
      ['n=v; HttpOnly='],
      ['n=v; HttpOnly=yes'],
      ['n=v; HttpOnly', {fromHttpApi: false}],
      ['__Secure-n=v'],
      ['__Secure-n=v; Secure', {isSecureEnv: false}],
      ['__Host-n=v'],
      ['__Host-n=v; Secure'],
      ['__Host-n=v; Secure; Domain=example.com'],
      ['__Host-n=v; Secure; Path=somewhere'],
      ['__Host-n=v; Secure; Path=/', {isSecureEnv: false}],
      ['n=v', {requestURL: 'https://example/\b'}],
      ['n=v; Domain=example.com', {requestURL: 'example.biz'}],
      ['n=v; Domain=example.com', {requestURL: 'some-example.com'}],
      ['n=v; Domain=foo.example.com', {requestURL: 'example.com'}],
      ['n=v; Domain=bar.example.com', {requestURL: 'foo.example.com'}],
      ['n=v; Domain=bar.foo.example.com', {requestURL: 'foo.example.com'}],
      ['n=v'],
      ['n=v', {requestURL: '.'}],
      ['n=v; Domain=example.com; SameSite=Strict', {topLevelURL: 'some-other-example.com'}]
    ],
    valid: [
      ['ok=', {requestURL: 'example.com'}],
      ['ok="example"', {requestURL: 'example.com'}],
      ['ok=example;;', {requestURL: 'example.com'}],
      ['test=;someNewAttribute=;someNewFlag', {requestURL: 'example.com'}],
      ['test=; someNewAttribute=; someNewFlag', {requestURL: 'example.com'}],
      ['n=v; expires=Tue, 27 Jun 2032 01:50:08 GMT;', {requestURL: 'example.com'}],
      ['n=v;Expires=Tue, 27 Jun 2032 01:50:08 GMT;', {requestURL: 'example.com'}],
      ['n=v; Expires=Tue, 27 Jun 2017 01:50:08 GMT;', {requestURL: 'example.com'}],
      ['n=v; max-Age=900719925474', {requestURL: 'example.com'}],
      ['n=v;Max-Age=900719925474', {requestURL: 'example.com'}],
      ['n=v; Max-Age=0', {requestURL: 'example.com'}],
      ['n=v; Max-Age=-1', {requestURL: 'example.com'}],
      ['n=v; Domain=.example.com'],
      ['n=v; path=', {requestURL: 'example.com'}],
      ['n=v;Path=/', {requestURL: 'example.com'}],
      ['n=v;secure', {requestURL: 'example.com'}],
      ['n=v; Secure', {requestURL: 'example.com'}],
      ['n=v; HttpOnly', {requestURL: 'example.com'}],
      ['n=v; samesite=lax', {requestURL: 'example.com'}],
      ['n=v; samesite=Lax', {requestURL: 'example.com'}],
      ['n=v;SameSite=LaX', {requestURL: 'example.com'}],
      ['n=v; samesite', {requestURL: 'example.com'}],
      ['n=v; SameSite=', {requestURL: 'example.com'}],
      ['n=v; samesite=Strict', {requestURL: 'example.com'}],
      ['n=v; SameSite=STRICT', {requestURL: 'example.com'}],
      ['n=v; SameSite=SomethingSomething', {requestURL: 'example.com'}],
      ['__Secure-n=v; Secure', {requestURL: 'example.com'}],
      ['__Host-n=v; Secure; Path=/', {requestURL: 'example.com'}],
      ['n=v', {requestURL: 'example.com/somewhere?foo=bar'}],
      ['n=v', {requestURL: 'https://example.com/somewhere/?foo=bar'}],
      ['n=v', {requestURL: 'https://example.com/'}],
      ['n=v; Domain=example.com', {domain: 'example.com'}, {requestURL: 'example.com'}],
      ['n=v; Domain=example.com', {domain: 'example.com'}, {requestURL: 'foo.example.com'}],
      ['n=v; Domain=.example.com', {domain: 'example.com'}, {requestURL: '.example.com'}],
      ['n=v; Domain=example.com', {domain: 'example.com'}, {requestURL: '.example.com'}],
      ['n=v; Domain=.example.com', {domain: 'example.com'}, {requestURL: '.foo.example.com'}],
      ['n=v; Domain=.foo.example.com', {domain: 'foo.example.com'}, {requestURL: '.foo.example.com'}],
      ['n=v; Domain=com', {domain: 'com'}],
      ['n=v; Domain=com', {domain: 'com'}, {requestURL: 'com'}],
      [
        'NID=106=qlMlHK1TVTfnsiVYMERjFeXekZs14vzn4uA3Q9et4lry-D3Lb2ZstZaljOyHMWsxUduFuhXYGx2BMqBVcXh2OQGUD7zC1m9dUJZ4D9xhIfcbTvnOX1KCge0xs7JgBqyEO_l00KpJqrzvFexwAg; expires=Wed, 27-Dec-2017 14:28:35 GMT; path=/; domain=.google.com; HttpOnly',
        {requestURL: 'google.com'}
      ]
    ]
  },
  addCookieObjects: {
    invalid: [
      [null],
      [[]],
      [{}],
      [{name: ''}],
      [{name: 'ø'}],
      [{name: 'n', value: 'ø'}],
      [{name: 'n', value: null}],
      [{name: 'n', value: '\b'}]
    ],
    valid: [
      [{name: 'n', value: '"v"'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v'}, {requestURL: 'com'}],
      [{name: 'n', value: 'v', expires: new Date(0)}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', expires: new Date(1498591378533)}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', Expires: 1498591378533}, {requestURL: 'example.com'}],
      [
        {
          name: 'n',
          value: 'v',
          Expires: 'Tue, 27 Jun 2017 19:22:58 GMT'
        },
        {requestURL: 'example.com'}
      ],
      [
        {
          name: 'n',
          value: 'v',
          Expires: new Date(1498591378533),
          'Max-Age': 0
        },
        {requestURL: 'example.com'}
      ],
      [
        {
          name: 'n',
          value: 'v',
          Expires: new Date(1498591378533),
          'max-age': 0
        },
        {requestURL: 'example.com'}
      ],
      [{name: 'n', value: 'v', maxAge: 0}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', domain: 'example.com'}],
      [{name: 'n', value: 'v', Domain: '.foo.example.com'}],
      [{name: 'n', value: 'v', path: '/'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', Path: '/foo/bar/'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', secure: false}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', secure: true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', Secure: true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', 'http-only': true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', 'Http-Only': false}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', 'Http-Only': true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', httpOnly: false}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', httpOnly: true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', httponly: false}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', httponly: true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: 'lax'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: 'LaX'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: ''}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: 'strict'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: 'STRICT'}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: true}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: null}, {requestURL: 'example.com'}],
      [{name: 'n', value: 'v', samesite: false}, {requestURL: 'example.com'}],
      [{
        name: 'n',
        value: 'v',
        someNewAttribute: '',
        someNewAttribute2: 'nv2',
        someNewFlag: true
      }, {requestURL: 'example.com'}]
    ]
  },
  safeHTTPMethods: [
    'GET',
    'HEAD',
    'OPTIONS',
    'TRACE'
  ],
  unsafeHTTPMethods: [
    'POST',
    'PUT',
    'DELETE',
    'PATCH'
  ],
  sameSiteTypes: [
    'None',
    'Lax',
    'Strict'
  ],
  sampleTopLevelNavDomains: [
    ['example.com', true],
    ['not-example.com', false],
    ['sub.example.com', true],
    [{hostname: 'example.com'}, true],
    [{hostname: 'not-example.com'}, false],
    [{hostname: 'sub.example.com'}, true]
  ],
  samplePublicSuffixErrorCode: 'jetta-cookie-public-suffix-error',
  samplePublicSuffixErrorEmitMessage: 'public suffix emit test',
  shortTimeoutForPublicSuffixDestructionTests: 1
}

module.exports = Object.assign({}, sharedConfig, local)
