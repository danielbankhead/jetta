## Tests


scope, so that you can trace where the test is failing

Each test category (...category) can be tested independently via npm's [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) tool (included with npm 5.2.0 or later). Example:
```sh
$ npx tape test/request/ | npx tap-spec
```

If a test crash you can debug via `node --trace-warnings`. Example:
```sh
$ node --trace-warnings test/request/
```


rm -f *.sock && npx tape test/request/ | npx tap-spec



uniform Array format for scope
automatically converts Objects to strings

m = tools.generateTestMessage
ev = tools.errorVerification
ps = jetta.PublicSuffix instance
cm = jetta.CookieManager instance
b = [bronze](https://github.com/AltusAero/bronze) instance (unique id generator)

// [![NSP Status](https://nodesecurity.io/orgs/altus-aero/projects/97b98726-30b7-4837-bf92-77b4621a8bd0/badge)](https://nodesecurity.io/orgs/altus-aero/projects/97b98726-30b7-4837-bf92-77b4621a8bd0)



tools/.test-request-custom-engines.js
  (create 'tools' folder at the root of the project if is doesn't exist)
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






Less verbose output by default
  change:

  ```js
  const t = testTools.lessVerboseOutput(test)
  ```

  to:

  ```js
  // const t = testTools.lessVerboseOutput(test)
  const t = test
  ```










data/test/
  - shared-config
    - update langs
  - cached-public-suffix.dat
    - for tests (to cut bandwidth and respect the maintainers of the public-suffix database)


  Test certs can be created via:

  ```sh
  $ openssl req -x509 -days 3650 -nodes -newkey rsa:4096 -keyout tls-priv.pem -out tls-cert.pem
  ```





























Perhaps move to data/test/... ?
  RELATED: test/README.md


// "Content-Encoding: gzip"
// "Content-Encoding: gzip, gzip, gzip"
// "Content-Encoding: gzip, deflate, gzip"

dd if=/dev/zero bs=102400 count=1  | gzip > 100KiB-of-0s.gzip
dd if=/dev/zero bs=1048576 count=1024  | gzip | gzip | gzip > 1GiB-of-0s.gzip.gzip.gzip

```js
const MiB = Buffer.alloc(1 * 1024 * 1024)
const compressed = zlib.gzipSync(zlib.deflateSync(zlib.gzipSync(MiB)))
fs.writeFileSync('1MiB-of-0s.gzip.zlib.gzip', compressed)
```

TODO: deflate, gzip example






