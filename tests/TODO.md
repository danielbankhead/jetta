Tests are under development


```js
// #! /usr/local/bin/node
'use strict'

const jetta = require('../')
const config = require('../data/tests/config')
const tape = require('tape')

const Bronze = require('bronze')
const idGen = new Bronze({name: `jetta-test`})
const testIdentifier = idGen.generate()

const platform = os.platform()

// Use sockets for local testing
let socket = null

if (platform === 'win32') {
  socket = `\\\\.\\pipe\\${testIdentifier}`
} else {
  socket = `/${testIdentifier}.sock`
}



// url
// https://mathiasbynens.be/demo/url-regex
const valid = [
  'http://foo.com/blah_blah',
  'http://foo.com/blah_blah/',
  'http://foo.com/blah_blah_(wikipedia)',
  'http://foo.com/blah_blah_(wikipedia)_(again)',
  'http://www.example.com/wpstyle/?p=364',
  'https://www.example.com/foo/?bar=baz&inga=42&quux',
  'http://✪df.ws/123',
  'http://userid:password@example.com:8080',
  'http://userid:password@example.com:8080/',
  'http://userid@example.com',
  'http://userid@example.com/',
  'http://userid@example.com:8080',
  'http://userid@example.com:8080/',
  'http://userid:password@example.com',
  'http://userid:password@example.com/',
  'http://142.42.1.1/',
  'http://142.42.1.1:8080/',
  'http://➡.ws/䨹',
  'http://⌘.ws',
  'http://⌘.ws/',
  'http://foo.com/blah_(wikipedia)#cite-1',
  'http://foo.com/blah_(wikipedia)_blah#cite-1',
  'http://foo.com/unicode_(✪)_in_parens',
  'http://foo.com/(something)?after=parens',
  'http://☺.damowmow.com/',
  'http://code.google.com/events/#&product=browser',
  'http://j.mp',
  'ftp://foo.bar/baz',
  'http://foo.bar/?q=Test%20URL-encoded%20stuff',
  'http://مثال.إختبار',
  'http://例子.测试',
  'http://उदाहरण.परीक्षा',
  'http://-.~_!$&\'()*+,;=:%40:80%2f::::::@example.com',
  'http://1337.net',
  'http://a.b-c.de',
  'http://223.255.255.254'
]

const invalid = [
  'http://',
  'http://.',
  'http://..',
  'http://../',
  'http://?',
  'http://??',
  'http://??/',
  'http://#',
  'http://##',
  'http://##/',
  'http://foo.bar?q=Spaces should be encoded',
  '//',
  '//a',
  '///a',
  '///',
  'http:///a',
  'foo.com',
  'rdar://1234',
  'h://test',
  'http:// shouldfail.com',
  ':// should fail',
  'http://foo.bar/foo(bar)baz quux',
  'ftps://foo.bar/',
  'http://-error-.invalid/',
  'http://a.b--c.de/',
  'http://-a.b.co',
  'http://a.b-.co',
  'http://0.0.0.0',
  'http://10.1.1.0',
  'http://10.1.1.255',
  'http://224.1.1.1',
  'http://1.1.1.1.1',
  'http://123.123.123',
  'http://3628126748',
  'http://.www.foo.bar/',
  'http://www.foo.bar./',
  'http://.www.foo.bar./',
  'http://10.1.1.1',
  'http://10.1.1.254'
]

valid.forEach(item => {if(up(item).valid === false) {console.log(item)} })

invalid.forEach(item => {
  const r = up(item, {addMissingProtocol: true})
  if (r.valid === true) {
    console.log(`\`${item}\` hostname: \`${r.parsedURL.hostname}\``)
  }
})



```
