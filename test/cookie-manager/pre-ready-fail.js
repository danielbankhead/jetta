'use strict'

function preReadyFailTests (t = () => {}, parentScope = [], sharedState = {}) {
  const scope = [...parentScope, preReadyFailTests.name]
  const {config, ev, cm} = sharedState
  const cachedpreferredErrorLanguage = cm.preferredErrorLanguage

  cm.cookies = {}

  for (let i = 0, len = config.currentAvailableLangs.length; i < len; i++) {
    const preferredErrorLanguage = config.currentAvailableLangs[i]

    cm.preferredErrorLanguage = preferredErrorLanguage

    try {
      cm.addCookie('n=v; Domain=example.com', {requestURL: 'sub.example.com'})
      throw new Error()
    } catch (e) {
      ev({t, scope: [...scope, `addCookie() should fail when cookie manager is not ready`], e, errorCategory: 'publicSuffix', preferredErrorLanguage})
    }
  }

  cm.cookies = {}

  cm.preferredErrorLanguage = cachedpreferredErrorLanguage
}

module.exports = preReadyFailTests
