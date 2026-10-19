//
// Mock guides that copy a real guide (one the prototype reads from the PoC
// API), and the real guide each copies. While the real guide is there, the
// playground treats the mock's id as the real guide's: the hub lists the real
// one only, lists of ids saved this session (recently opened, pinned,
// bookmarked) resolve to it, a designer's draft started on the mock shows on
// it, and the mock's own address redirects to it. Without the API (no real
// guides), the mocks stand on their own as before.
//
// The mocks keep their own slugs because the frozen snapshots link to them.
//

const LIVE_BY_MOCK = {
  'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026':
    'cs-ma-claim-land-use-or-land-cover-not-compatible-with-option-at-signoff',
  'cs-ma-revenue-options-claim-rule-signoff-2026':
    'cs-ma-claim-revenue-option-claim-rule-at-signoff',
  'cs-ma-agreement-level-options-not-verified-2026':
    'cs-ma-claim-agreement-level-options-not-verified',
  'cs-ma-claim-refresh-signoff-check-2026':
    'cs-ma-claim-claim-refresh-signoff-check',
  'cs-ma-claim-existing-2026': 'cs-ma-claim-existing-mta',
  'cs-ma-claim-ab12-op3-maximum-eligible-weight-2026':
    'cs-ma-claim-ab12-or-op3-maximum-eligible-weight',
  'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026':
    'cs-ma-claim-parcels-not-under-control-of-sbi-at-signoff',
  'cs-ma-evidence-required-2026': 'cs-ma-evidence-required',
  'cs-revenue-claims-processing-final-payment-guide':
    'cs-revenue-claims-processing-to-final-payment-guide'
}

function hasRealGuide(req, id) {
  return (req.apiGuides || []).some((guide) => guide.id === id)
}

// The id to use for a guide: the real guide's, for a mock copy whose real
// guide is there; otherwise the id itself.
function resolveGuideId(req, id) {
  const live = LIVE_BY_MOCK[id]
  return live && hasRealGuide(req, live) ? live : id
}

// Ids resolved, each once, in their first order.
function resolveGuideIds(req, ids) {
  const resolved = []
  ids.forEach((id) => {
    const live = resolveGuideId(req, id)
    if (resolved.indexOf(live) === -1) resolved.push(live)
  })
  return resolved
}

// A mock copy whose real guide is there, so the mock isn't listed itself.
function isReplacedMock(req, id) {
  return resolveGuideId(req, id) !== id
}

// The mock ids that copy a real guide.
function mockIdsOf(liveId) {
  return Object.keys(LIVE_BY_MOCK).filter(
    (mock) => LIVE_BY_MOCK[mock] === liveId
  )
}

module.exports = {
  resolveGuideId,
  resolveGuideIds,
  isReplacedMock,
  mockIdsOf
}
