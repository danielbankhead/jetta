#! /usr/local/bin/node
'use strict'

class JettaError extends Error {
  constructor (code = '', preferredErrorLanguage = '', details = {}) {
    super()

    this.code = code
    this.details = details

    Object.assign(this, this.constructor.getErrorMessage(code, preferredErrorLanguage, details))
  }

  static getErrorMessage (code = '', preferredErrorLanguage = '', details = {}) {
    switch (code) {
      case 'jetta-cookie-invalid-name':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's name is invalid`
            }
        }
      case 'jetta-cookie-invalid-name-value-pair':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid name-value pair`
            }
        }
      case 'jetta-cookie-invalid-value':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's value is invalid`
            }
        }
      case 'jetta-cookie-invalid-expires':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid date for Expires`
            }
        }
      case 'jetta-cookie-invalid-max-age':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie does not have a valid number of seconds for Max-Age`
            }
        }
      case 'jetta-cookie-expired':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The attribute '${details.attribute}' is expired while \`allowExpiredSetCookie = false\``
            }
        }
      case 'jetta-cookie-invalid-domain-type':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's domain is a '${details.type}' when it should be a string`
            }
        }
      case 'jetta-cookie-invalid-domain':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.domain.url}' is an invalid cookie domain`
            }
        }
      case 'jetta-cookie-invalid-path':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.path}' is not a valid cookie path`
            }
        }
      case 'jetta-cookie-invalid-secure':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.value}' is an invalid Secure value for cookie, should be \`true\` (i.e. no prepended value) if present`
            }
        }
      case 'jetta-cookie-invalid-httponly':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `'${details.value}' is an invalid HttpOnly value for cookie, should be \`true\` (i.e. no prepended value) if present`
            }
        }
      case 'jetta-cookie-httponly-from-non-http-api':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `The cookie's HttpOnly flag has been set, but has been received via an non HTTP API`
            }
        }
      case 'jetta-cookie-set-secure-attribute-not-secure-env':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie has Secure flag, but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-secure-prefix-not-secure-env':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Secure-', but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-secure-prefix-missing-secure-attribute':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Secure-', but missing cookie missing Secure flag`
            }
        }
      case 'jetta-cookie-set-host-prefix-not-secure-env':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', but not set in secure environment (TLS, HTTPS, etc.)`
            }
        }
      case 'jetta-cookie-set-host-prefix-missing-secure-attribute':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', but missing cookie missing Secure flag`
            }
        }
      case 'jetta-cookie-set-host-prefix-no-domain':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', thus Domain must not be specified`
            }
        }
      case 'jetta-cookie-set-host-prefix-path-not-root':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie is prefixed with '__Host-', thus Path must be set to '/'`
            }
        }
      case 'jetta-cookie-hostname-not-in-env':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's domain '${details.cookieDomain}' is not in request's domain '${details.hostname}'`
            }
        }
      case 'jetta-cookie-hostname-is-public-suffix':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's domain '${details.cookieDomain}' is a public suffix while the request's domain is not`
            }
        }
      case 'jetta-cookie-public-suffix-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie manager's PublicSuffix instance raised an error (${details.code}): '${details.message}'`
            }
        }
      case 'jetta-cookie-no-valid-domain-for-use':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie does not have a Domain and the given requestURL is invalid`
            }
        }
      case 'jetta-cookie-cross-site-on-samesite-cookie':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Can't accept a cross-site cookie with a SameSite attribute`
            }
        }
      case 'jetta-cookie-no-third-party-cookies-allowed':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `A third-party cookie was received while \`thirdPartyCookiesAllowed = false\``
            }
        }
      case 'jetta-cookie-non-http-no-overwrite-httponly':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie received via non HTTP API cannot overwrite a cookie set with HTTPOnly`
            }
        }
      case 'jetta-cookie-stringify-cookie-not-array':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie list should be an array of objects`
            }
        }
      case 'jetta-cookie-stringify-cookie-kv-not-valid-object':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie should be a non-null object`
            }
        }
      case 'jetta-cookie-stringify-set-cookie-not-valid-object':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Set-Cookie should be a non-null object`
            }
        }
      case 'jetta-cookie-request-url-invalid':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's request URL '${details.url}' is invalid`
            }
        }
      case 'jetta-cookie-top-level-url-invalid':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie's top-level URL '${details.url}' is invalid`
            }
        }
      case 'jetta-cookie-exceeded-max-cookie-byte-length':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cookie has exceeded the max length for cookie manager`
            }
        }
      case 'jetta-make-directory-fail':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Failed to created directory '${details.directory}'. Error code: '${details.e.code}'`
            }
        }
      case 'jetta-public-suffix-not-ready':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Public suffix is not ready`
            }
        }
      case 'jetta-public-suffix-failed-to-update-no-sources':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Public suffix failed to update - no sources to pull from`
            }
        }
      case 'jetta-public-suffix-failed-to-update-from-sources':
        switch (preferredErrorLanguage) {
          default:
            let enNestedSources = []

            for (let i = 0, len = details.length; i < len; i++) {
              enNestedSources[enNestedSources.length] = `Source '${details[i].source}' received '${details[i].error.code}'`
            }

            return {
              lang: 'en',
              message: `Public suffix failed to update from sources. ${enNestedSources.join('. ')}`
            }
        }
      case 'jetta-public-suffix-failed-to-write-file':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Public suffix failed to write file - see Error in details`
            }
        }
      case 'jetta-request-too-many-redirects':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received too many redirects`
            }
        }
      case 'jetta-request-bad-response-code':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received bad response code: '${details.statusCode}'`
            }
        }
      case 'jetta-request-checksum-verification-failed':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's checksum verification failed - the data may have been corrupted or tampered with`
            }
        }
      case 'jetta-request-exceeded-data-limit-content-length':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's Content-Length header was larger than the request data limit`
            }
        }
      case 'jetta-request-decompress-failed':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Failed to decompress the request's data: '${details.code}'`
            }
        }
      case 'jetta-request-decompressed-data-limit':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's decompressed data was larger than the request data limit`
            }
        }
      case 'jetta-request-exceeded-data-limit-actual':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request's data received was larger than the request data limit`
            }
        }
      case 'jetta-request-response-timed-out-during':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request timed out between recieving data`
            }
        }
      case 'jetta-request-response-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error on the response: '${details.message}'`
            }
        }
      case 'jetta-request-cookie-manager-setup-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request could not complete because the cookieManger failed to setup: '${details.code}'`
            }
        }
      case 'jetta-request-stream-not-readable':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received a stream to stream to server, but it was not readable`
            }
        }
      case 'jetta-request-invalid-url':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an invalid URL: '${details.url}'`
            }
        }
      case 'jetta-request-unsupported-protocol':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request does not have an engine to support the '${details.protocol}' protocol. Consider using the \`engine\` option to support it`
            }
        }
      case 'jetta-request-client-aborted':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request was aborted by the client`
            }
        }
      case 'jetta-request-server-aborted':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request was aborted by the server`
            }
        }
      case 'jetta-request-response-aborted':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request was aborted during response`
            }
        }
      case 'jetta-request-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error: '${details.code}'`
            }
        }
      case 'jetta-request-timed-out-initial':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request timed out before a response was sent from the server`
            }
        }
      case 'jetta-request-stream-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error from stream: '${details.code}'`
            }
        }
      case 'jetta-request-error-setting-cookie':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error setting a cookie: '${details.code}'`
            }
        }
      case 'jetta-request-error-processing-cookie-header':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error processing the cookie header: '${details.message}'`
            }
        }
      case 'jetta-request-write-file-stream-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error while writing a file: '${details.code}'`
            }
        }
      case 'jetta-request-url-decode-uri-component-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error decoding the URL: '${details.message}'`
            }
        }
      case 'jetta-request-file-stat-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error on reading stats on file: '${details.code}'`
            }
        }
      case 'jetta-request-file-read-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an error on reading file: '${details.code}'`
            }
        }
      case 'jetta-request-invalid-value-for-data-protocol':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an invalid value while parsing \`data:\``
            }
        }
      case 'jetta-request-invalid-file-url':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Request received an invalid \`file:\` URL: '${details.url}'`
            }
        }
      case 'jetta-request-encoding-not-allowed':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Encoding '${details.encoding}' is not allowed. Consider modifying the request's Accept-Encoding header if you would like to support it`
            }
        }
      case 'jetta-request-invalid-checksum-algorithm':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Algorithm '${details.algorithm}' is not supported. Consider using a different algorithm and retry the request`
            }
        }
      case 'jetta-request-invalid-checksum-digest':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Digest '${details.digest}' is not supported. Consider using a different digest and retry the request`
            }
        }
      case 'jetta-request-json-parse-error':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Failed to parse JSON at the end of the request - may be invalid or ill-formatted. See Error in details`
            }
        }
      case 'jetta-request-checksum-on-encoded-data':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Cannot use checksum on encoded data as checksum results would be inaccurate. Try request again without modifying accepted encodings`
            }
        }
      case 'jetta-request-prepare-fail':
        switch (preferredErrorLanguage) {
          default:
            return {
              lang: 'en',
              message: `Failed to prepare request. See Error in details`
            }
        }
      default:
        switch (preferredErrorLanguage) {
          default:
            throw new Error(`unknown error code: '${code}' [lang: "en"]`)
        }
    }
  }
}

module.exports = JettaError
