## Tests

To ensure a reliability and 100% coverage, we've developed a thorough, modular test suite that's extensible and easy to maintain.

Tests are divided into categories, denoted by their folder (i.e. `cookie-lib`, `cookie-manager`, `request`, etc.). Each are isolated and share no state between each other - this way they can be tested independently via npm's [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) tool (included with npm 5.2.0 or later). Example:
```sh
$ npx tape test/request/ | npx tap-spec
```

If a test crash you can debug via `node --trace-warnings`. Example:
```sh
$ node --trace-warnings test/request/
```

To run the complete test suite simply use:
```sh
$ npm test
```

Some tests, such as `request`, will temporarily create files, folders, and sockets in the current directory. These do no harm, but if a test crash they may make a mess. You can use something like the following example to quickly clean things up:
```sh
$ rm -f *.sock && npx tape test/request/ | npx tap-spec
```

After running some tests you may notice that messages are 'scoped' so that you may trace exactly where something has occurred.


### Common Variable Aliases

Throughout the test suite we use the following variable aliases:
- `m` = `tools.generateTestMessage`, from `test/tools.js`
- `ev` = `tools.errorVerification`, from `test/tools.js`
- `ps` = `jetta.PublicSuffix` instance
- `cm` = `jetta.CookieManager` instance
- `b` = [bronze](https://github.com/AltusAero/bronze) instance (unique id generator)


### Adding Your Own Custom Engine

Testing compatibility with your custom engines with jetta is rather straight-forward. Simply create a new module in `tools/.test-request-custom-engines.js` (create the 'tools' directory at the root of the project if is doesn't exist - no worries, this file is ignored by git by default).

The module should export an array of objects. Each object should have a 'name' as a string, the 'engines' object, a 'start' function that returns a Promise, and a 'shutdown' function that returns a Promise.

- The module is an array of objects so that you may test multiple engines and combinations at once.
- An object's 'name' attribute is so that you can identify the

Example:
```js
const customEngines = [
  {
    name: 'custom engine 1',
    engines: {
      'http:': http.request,
      'https:': https.request
    },
    start: async () => {
      // await something()...
    },
    shutdown: async () => {
      // await somethingForShutdown()...
    }
  },
  {
    name: 'custom engine 2',
    engines: {
      'data:': () => {},
      'file:': () => {},
      'fancy-new-protocol:': () => {}
    },
    start: async () => {},
    shutdown: async () => {}
  }
]

module.exports = customEngines
```

You can run `npm test` to run the full test suite or `node test/request/` only test the request features. Starting off you may save time by testing the `node test/request/` for issues first.


### Test Verbosity

By default tests are not very verbose - we've ran into log limit issues on Travis-CI because we've exceeded their 4MB limit. To make tests more verbose for local testing change the following in the root of each test (where available):
```js
const t = testTools.lessVerboseOutput(test)
```
to:
```js
// const t = testTools.lessVerboseOutput(test)
const t = test
```


### Static Test Files

The `data/test/` contains a few files for testing. Here's what they are:
  - `shared-config.json` - shared configuration between tests, such as supported error languages
  - `.cached-public-suffix.dat` - cached public suffix list to cut bandwidth and respect the maintainers of the public suffix list
    - Ignored git by default
  - `tls-cert.pem` and `tls-priv.pem` - sample key and cert for testing TLS and the `https:` protocol
    - Test certs can be created via:
      ```sh
      $ openssl req -x509 -days 3650 -nodes -newkey rsa:4096 -keyout tls-priv.pem -out tls-cert.pem
      ```
