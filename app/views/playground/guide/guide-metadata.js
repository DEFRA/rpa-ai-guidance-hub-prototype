// Upload-journey metadata (owner, purpose, required knowledge, systems,
// audience) for guides that predate the upload journey — the journey
// itself only ever produces one real guide (upload/view-model.js's
// CONVERTED_GUIDE_ID, whose own session-entered details the guide page
// reads directly instead of this file), so every other guide needs
// equivalent made-up detail to show the same fields on its guide page.
// Keyed by systems/audience value, same as V4_SYSTEMS/V4_AUDIENCE
// (upload/view-model.js) — the guide page labels them the same way.
const DEFAULT_METADATA = {
  owner: 'joe.bloggs@defra.gov.uk',
  goal: 'Give casework staff a consistent way to check this against the scheme rules.',
  requirements: 'None — written for anyone processing this scheme.',
  systems: ['crm'],
  audience: ['processor']
}

const METADATA_BY_ID = {
  'cs-ma-revenue-options-claim-rule-signoff-2026': {
    owner: 'alice.bloggs@defra.gov.uk',
    goal: 'Explain how to identify and resolve conflicting or overlapping claims against revenue options at signoff.',
    requirements:
      'Familiarity with the CS Mid Tier claim rules and access to the options map on CRM.',
    systems: ['crm'],
    audience: ['processor', 'team-leader']
  },
  'cs-revenue-claims-processing-final-payment-guide': {
    owner: 'john.doe@defra.gov.uk',
    goal: 'Walk a processor through revenue claims from initial check to final payment.',
    requirements: 'Completion of CS revenue claims induction training.',
    systems: ['crm', 'rps'],
    audience: ['processor']
  },
  'cs-mid-tier-hedgerow-and-boundary-options': {
    owner: 'jane.doe@defra.gov.uk',
    goal: 'Set out how hedgerow and boundary options are assessed at application, for anyone reviewing a Mid Tier agreement.',
    requirements: 'None — written for anyone assessing a Mid Tier application.',
    systems: ['crm', 'lms'],
    audience: ['processor', 'technical-specialist']
  }
}

function getGuideMetadata(id) {
  return METADATA_BY_ID[id] || DEFAULT_METADATA
}

module.exports = { getGuideMetadata }
