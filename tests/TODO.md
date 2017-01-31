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
```
