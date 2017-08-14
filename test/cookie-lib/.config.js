'use strict'

const sharedConfig = require('../../data/test/shared-config')

const local = {
  parseCookie: {
    invalid: [
      [';'],
      ['example'],
      ['ø=this'],
      ['test=ø'],
      ['ok=example;ø=this'],
      ['ok=example; ø=this'],
      ['ok=example;fail=ø'],
      ['ok=example; fail=ø']
    ],
    valid: [
      ['ok='],
      ['ok=example'],
      ['ok="example"'],
      ['ok=example;another=ok'],
      ['ok=example; another=ok']
    ]
  },
  parseSetCookie: {
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
      ['n=v', {requestURL: '.'}]
    ],
    valid: [
      ['ok=', {name: 'ok', value: ''}],
      ['ok="example"', {name: 'ok', value: 'example'}],
      ['ok=example;;', {name: 'ok', value: 'example'}],
      ['test=;someNewAttribute=;someNewFlag', {someNewAttribute: '', someNewFlag: true}],
      ['test=; someNewAttribute=; someNewFlag', {someNewAttribute: '', someNewFlag: true}],
      ['n=v; expires=Tue, 27 Jun 2032 01:50:08 GMT;'],
      ['n=v;Expires=Tue, 27 Jun 2032 01:50:08 GMT;'],
      ['n=v; Expires=Tue, 27 Jun 2017 01:50:08 GMT;'],
      ['n=v; max-Age=900719925474'],
      ['n=v;Max-Age=900719925474'],
      ['n=v; Max-Age=0'],
      ['n=v; Max-Age=-1'],
      ['n=v; Domain=.example.com'],
      ['n=v; path='],
      ['n=v;Path=/'],
      ['n=v;secure'],
      ['n=v; Secure'],
      ['n=v; HttpOnly'],
      ['n=v; samesite=lax', {samesite: 'Lax'}],
      ['n=v; samesite=Lax', {samesite: 'Lax'}],
      ['n=v;SameSite=LaX', {samesite: 'Lax'}],
      ['n=v; samesite', {samesite: 'Strict'}],
      ['n=v; SameSite=', {samesite: 'Strict'}],
      ['n=v; samesite=Strict', {samesite: 'Strict'}],
      ['n=v; SameSite=STRICT', {samesite: 'Strict'}],
      ['n=v; SameSite=SomethingSomething', {samesite: 'Strict'}],
      ['__Secure-n=v; Secure', {name: '__Secure-n'}],
      ['__Host-n=v; Secure; Path=/', {name: '__Host-n', path: '/'}],
      ['n=v', {path: '/somewhere'}, {requestURL: 'example.com/somewhere?foo=bar'}],
      ['n=v', {path: '/somewhere'}, {requestURL: 'https://example.com/somewhere/?foo=bar'}],
      ['n=v', {name: 'n', value: 'v'}, {requestURL: 'https://example.com/'}],
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
        {
          name: 'NID',
          value: '106=qlMlHK1TVTfnsiVYMERjFeXekZs14vzn4uA3Q9et4lry-D3Lb2ZstZaljOyHMWsxUduFuhXYGx2BMqBVcXh2OQGUD7zC1m9dUJZ4D9xhIfcbTvnOX1KCge0xs7JgBqyEO_l00KpJqrzvFexwAg',
          path: '/',
          expires: new Date(1514384915000),
          domain: 'google.com',
          httpOnly: true
        },
        {requestURL: 'google.com'}
      ]
    ]
  },
  stringifyCookie: {
    invalid: [
      [
        [{}]
      ],
      [
        [{name: null, value: 'example'}]
      ],
      [
        [{name: '', value: null}]
      ],
      [
        [{name: 'n', value: null}]
      ],
      [
        [{name: 'ø=this', value: ''}]
      ],
      [
        [{name: 'test', value: 'ø=this'}]
      ],
      [
        [{name: 'test', value: 'ok'}, {name: 'test', value: 'ø=this'}]
      ],
      [
        [{name: 'test', value: 'ok'}, {name: 'ø=this', value: 'test'}]
      ]
    ],
    valid: [
      [
        [{name: 'test', value: 'ok', someothervalue: true}], 'test=ok'
      ],
      [
        [{name: 'test', value: ''}, {name: 'test', value: '"apple"'}], 'test=; test=apple'
      ]
    ]
  },
  stringifyCookieKV: {
    invalid: [
      [{'': ''}],
      [{'': 'this'}],
      [{'ø': 'this'}],
      [{test: 'ø'}],
      [{ok: 'example', 'ø': 'this'}],
      [{ok: 'example', fail: 'ø'}]
    ],
    valid: [
      [[], ''],
      [{ok: ''}, 'ok='],
      [{ok: 'example'}, 'ok=example'],
      [{ok: 'example', another: 'ok'}, 'ok=example; another=ok']
    ]
  },
  stringifySetCookie: {
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
      [{name: 'n', value: '"v"'}, 'n=v'],
      [{Name: 'n', Value: '"v"'}, 'n=v'],
      [{name: 'n', value: 'v'}, 'n=v'],
      [{name: 'n', value: 'v'}, 'n=v'],
      [{name: 'n', value: 'v', expires: new Date(0)}, 'n=v; Expires=Thu, 01 Jan 1970 00:00:00 GMT'],
      [{name: 'n', value: 'v', expires: new Date(1498591378533)}, 'n=v; Expires=Tue, 27 Jun 2017 19:22:58 GMT'],
      [{name: 'n', value: 'v', Expires: 1498591378533}, 'n=v; Expires=Tue, 27 Jun 2017 19:22:58 GMT'],
      [
        {
          name: 'n',
          value: 'v',
          Expires: 'Tue, 27 Jun 2017 19:22:58 GMT'
        },
        'n=v; Expires=Tue, 27 Jun 2017 19:22:58 GMT'],
      [
        {
          name: 'n',
          value: 'v',
          Expires: new Date(1498591378533),
          'Max-Age': 0
        },
        'n=v; Expires=Tue, 27 Jun 2017 19:22:58 GMT; Max-Age=0'],
      [
        {
          name: 'n',
          value: 'v',
          Expires: new Date(1498591378533),
          'max-age': 0
        },
        'n=v; Expires=Tue, 27 Jun 2017 19:22:58 GMT; Max-Age=0'
      ],
      [{name: 'n', value: 'v', maxAge: 0}, 'n=v; Max-Age=0'],
      [{name: 'n', value: 'v', domain: 'example.com'}, 'n=v; Domain=example.com'],
      [{name: 'n', value: 'v', Domain: '.foo.example.com'}, 'n=v; Domain=foo.example.com'],
      [{name: 'n', value: 'v', path: '/'}, 'n=v; Path=/'],
      [{name: 'n', value: 'v', Path: '/foo/bar/'}, 'n=v; Path=/foo/bar/'],
      [{name: 'n', value: 'v', secure: false}, 'n=v'],
      [{name: 'n', value: 'v', secure: true}, 'n=v; Secure'],
      [{name: 'n', value: 'v', Secure: true}, 'n=v; Secure'],
      [{name: 'n', value: 'v', 'http-only': true}, 'n=v; HttpOnly'],
      [{name: 'n', value: 'v', 'Http-Only': false}, 'n=v'],
      [{name: 'n', value: 'v', 'Http-Only': true}, 'n=v; HttpOnly'],
      [{name: 'n', value: 'v', httpOnly: false}, 'n=v'],
      [{name: 'n', value: 'v', httpOnly: true}, 'n=v; HttpOnly'],
      [{name: 'n', value: 'v', httponly: false}, 'n=v'],
      [{name: 'n', value: 'v', httponly: true}, 'n=v; HttpOnly'],
      [{name: 'n', value: 'v', samesite: 'lax'}, 'n=v; SameSite=Lax'],
      [{name: 'n', value: 'v', samesite: 'LaX'}, 'n=v; SameSite=Lax'],
      [{name: 'n', value: 'v', samesite: ''}, 'n=v; SameSite=Strict'],
      [{name: 'n', value: 'v', samesite: 'strict'}, 'n=v; SameSite=Strict'],
      [{name: 'n', value: 'v', samesite: 'STRICT'}, 'n=v; SameSite=Strict'],
      [{name: 'n', value: 'v', samesite: true}, 'n=v; SameSite=Strict'],
      [{name: 'n', value: 'v', samesite: null}, 'n=v'],
      [{name: 'n', value: 'v', samesite: false}, 'n=v'],
      [{
        name: 'n',
        value: 'v',
        someNewAttribute: '',
        someNewAttribute2: 'nv2',
        someNewFlag: true
      },
        'n=v; someNewAttribute=; someNewAttribute2=nv2; someNewFlag']]
  },
  safeHTTPMethods: [
    'GET',
    'HEAD',
    'OPTIONS',
    'TRACE'
  ]
}

module.exports = Object.assign({}, sharedConfig, local)
