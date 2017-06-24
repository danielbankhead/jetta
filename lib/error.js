#! /usr/local/bin/node
'use strict'

class JettaError extends Error {
  constructor (code = '', preferredLanguage = '', details = {}) {
    super()

    this.code = code
    this.details = details

    // code STRING
    // message STRING
    // lang STRING lang used for message
    // details OBJECT of any additional details or arguments passed to the error

    Object.assign(this, this.constructor.getErrorMessage(code, preferredLanguage, details))
  }

  static getErrorMessage (code = '', preferredLanguage = '', details = {}) {
    /*
      TEST: error verification:
        - scope
          - 'CookieManager' must start with 'jetta-cookie'
            - message.toLowerCase().includes('cookie')
          - 'Public-Suffix' must start with 'jetta-public-suffix'
            - message.toLowerCase().includes('publicsuffix') || message.toLowerCase().includes('public suffix')
          - 'request' must start with 'jetta-request'
            - message.toLowerCase().includes('request')
        - is instance of JettaError
        - is instance of Error, which this can be tested seperately for this module
        - details is an Object && not null
        - lang is a string && length > 0
        - message must not be empty
        - message must not end with a period
    */

    switch (code) {
      case 'jetta-cookie-invalid-name':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's name is invalid`
            }
        }
      case 'jetta-cookie-invalid-name-value-pair':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid name-value pair`
            }
        }
      case 'jetta-cookie-invalid-value':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's value is invalid`
            }
        }
      case 'jetta-cookie-invalid-expires':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid date for Expires`
            }
        }
      case 'jetta-cookie-invalid-max-age':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid number of seconds for Max-Age`
            }
        }
      case 'jetta-cookie-expired':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The attribute '${details.attribute}' is expired while \`allowExpiredSetCookie = false\``
            }
        }
      case 'jetta-cookie-invalid-domain-type':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's domain is a '${details.type}' when it should be a string`
            }
        }
      case 'jetta-cookie-invalid-domain':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.domain.url}' is an invalid cookie domain`
            }
        }
      case 'jetta-cookie-invalid-path':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.path}' is not a valid cookie path`
            }
        }
      case 'jetta-cookie-invalid-secure':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.value}' is an invalid Secure value for cookie, should be \`true\` (i.e. no prepended value) if present`
            }
        }
      case 'jetta-cookie-invalid-httponly':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.value}' is an invalid HttpOnly value for cookie, should be \`true\` (i.e. no prepended value) if present`
            }
        }
      case 'jetta-cookie-httponly-from-non-http-api':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's HttpOnly flag has been set, but has been recieved via an non HTTP API`
            }
        }
      case 'jetta-cookie-set-secure-attribute-not-secure-env':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie has Secure flag, but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-secure-prefix-not-secure-env':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Secure-', but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-secure-prefix-missing-secure-attribute':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Secure-', but missing cookie missing Secure flag`
            }
        }
      case 'jetta-cookie-set-host-prefix-not-secure-env':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-host-prefix-missing-secure-attribute':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', but missing cookie missing Secure flag`
            }
        }
      case 'jetta-cookie-set-host-prefix-no-domain':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', thus Domain must not be specified`
            }
        }
      case 'jetta-cookie-set-host-prefix-path-not-root':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', thus Path must be set to '/'`
            }
        }
      case 'jetta-cookie-hostname-not-in-env':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's domain '${details.cookieDomain}' is not in request's domain '${details.hostname}'`
            }
        }
      case 'jetta-cookie-hostname-is-public-suffix':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's domain '${details.cookieDomain}' is a public suffix while the request's domain is not.`
            }
        }
      case 'jetta-cookie-public-suffix-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `CookieManager instance's PublicSuffix instance raised an error: '${details.message}'`
            }
        }
      case 'jetta-cookie-no-valid-domain-for-use':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie does not have a Domain and the given requestURL is invalid`
            }
        }
      case 'jetta-cookie-cross-site-on-samesite-cookie':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Can't accept a cross-site cookie with a SameSite attribute`
            }
        }
      case 'jetta-cookie-no-third-party-cookies-allowed':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `A third-party cookie was recieved while \`thirdPartyCookiesAllowed = false\``
            }
        }
      case 'jetta-cookie-non-http-no-overwrite-httponly':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie recieved via non HTTP API cannot overwrite a cookie set with HTTPOnly`
            }
        }
      case 'jetta-cookie-invalid-url':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.url}' is an invalid URL for a cookie`
            }
        }
      case 'jetta-public-suffix-not-ready':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Public suffix is not ready`
            }
        }
      case 'jetta-public-suffix-failed-to-update-no-sources':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Public suffix failed to update - no sources to pull from.`
            }
        }
      case 'jetta-public-suffix-failed-to-update-from-sources':
        switch (preferredLanguage) {
          default:
            let enNestedSources = []

            for (let i = 0, len = details.length; i < len; i++) {
              enNestedSources[enNestedSources.length] = `Source '${details[i].source}' recieved '${details[i].error.code || details[i].error.message}'`
            }

            return {
              lang: 'en',
              message: `Public Suffix failed to update from sources. ${enNestedSources.join('. ')}`
            }
        }
      case 'jetta-request-too-many-redirects':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received too many redirects`
            }
        }
      case 'jetta-request-bad-response-code':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received bad response code`
            }
        }
      case 'jetta-request-checksum-verification-failed':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's checksum verification failed - the file may have been corrupted or tampered with`
            }
        }
      case 'jetta-request-exceeded-data-limit-content-length':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's Content-Length header was larger than the request data limit`
            }
        }
      case 'jetta-request-decompress-failed':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Failed to decompress the request's data: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-exceeded-data-limit-actual':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's data recieved was larger than the request data limit`
            }
        }
      case 'jetta-request-response-exceeded-content-length':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's data exceeded its Content-Length header value`
            }
        }
      case 'jetta-request-response-timed-out-during':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request timed out between recieving data`
            }
        }
      case 'jetta-request-response-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error on the response: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-cookie-manager-setup-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request could not complete because the cookieManger failed to setup: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-stream-not-readable':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved a stream to stream to server, but it was not readable.`
            }
        }
      case 'jetta-request-invalid-url':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an invalid URL: '${details.url}'`
            }
        }
      case 'jetta-request-unsupported-protocol':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request does not have an engine to support the '${details.protocol}' protocol. Consider using the \`engine\` option to support it`
            }
        }
      case 'jetta-request-server-aborted':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request was aborted by the server.`
            }
        }
      case 'jetta-request-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-timed-out-initial':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request timed out before a response was sent from the server`
            }
        }
      case 'jetta-request-stream-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error from stream: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-stream-refused-to-flow':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's stream is not flowing, even after being assigned to the \`data\` event`
            }
        }
      case 'jetta-request-error-setting-cookie':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error setting a cookie: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-error-processing-cookie-header':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error processing the cookie header: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-write-file-stream-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error while writing a file: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-url-decode-uri-component-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error decoding the URL: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-file-stat-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error on reading stats on file: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-file-read-error':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an error on reading file: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-invalid-value-for-data-protocol':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an invalid value while parsing \`data:\`: '${details.code || details.message}'`
            }
        }
      case 'jetta-request-invalid-file-url':
        switch (preferredLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request recieved an invalid \`file:\` URL: '${details.code || details.message}'`
            }
        }
      default:
        throw new Error(`unknown error code: '${code}'`)
    }
  }
}

module.exports = JettaError
