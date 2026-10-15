const pwa = require('../../../data/pwa')
const {
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')

const radios = (options, selected) =>
  Object.keys(options).map((value) => ({
    value,
    text: options[value].text,
    hint: { text: options[value].hint },
    checked: value === selected
  }))

// The researcher-only PWA controls, plus the diagnostics that test each
// known risk (the PWA prototype plan) against two guides.
function settingsViewModel(req, base) {
  const [first, second] = buildManageGuidanceSearchResults(req, '')
  const diagnosticDoc = (document) => ({
    title: document.title,
    ...pwa.buildOpenLinks(req, base, document.id),
    guideHref: `${base}/guide/${encodeURIComponent(document.id)}`,
    doorHref: pwa.browserDoorHref(
      `${base}/guide/${encodeURIComponent(document.id)}`
    )
  })

  return {
    title: 'Prototype settings',
    action: `${base}/prototype-settings`,
    modeItems: radios(pwa.MODES, pwa.getMode(req)),
    bLaunchItems: radios(pwa.B_LAUNCH, pwa.getBLaunch(req)),
    saved: req.query.saved === '1',
    diagnostics: [first, second].filter(Boolean).map(diagnosticDoc)
  }
}

module.exports = { settingsViewModel }
