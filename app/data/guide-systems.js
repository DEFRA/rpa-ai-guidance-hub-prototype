//
// The systems a person needs to follow each guide: CRM and SITI Agri
// ("SITI Farmer" is part of SITI Agri). Read by the hub's "System used"
// filter (playground/hub/view-model.js). D365 has no guides yet: the hub
// shows it with a made-up count.
//
// The real guides (from the PoC API) were mapped on 2026-10-19 by reading
// each one for the steps that need a system, not passing mentions: three
// need SITI Agri only, the rest both, with CRM borderline (one step) in the
// AB12 or OP3 and PPA Recovery Assessment Matrix guides. A mock "… 2026"
// copy takes its real counterpart's systems. Of the other mock guides, the
// three with text of their own need both; the rest have placeholder text
// that names no system, so they need neither.
//

const CRM = 'crm'
const SITI_AGRI = 'siti-agri'

const BOTH = [CRM, SITI_AGRI]
const SITI_ONLY = [SITI_AGRI]

const SYSTEMS_BY_GUIDE = {
  // Real guides
  '2026-cs-ma-claim-admin-evidence-check': BOTH,
  'cs-ma-claim-ab12-or-op3-maximum-eligible-weight': BOTH,
  'cs-ma-claim-agreement-level-options-not-verified': SITI_ONLY,
  'cs-ma-claim-claim-refresh-signoff-check': SITI_ONLY,
  'cs-ma-claim-existing-mta': BOTH,
  'cs-ma-claim-in-checking-error': BOTH,
  'cs-ma-claim-land-use-or-land-cover-not-compatible-with-option-at-signoff':
    BOTH,
  'cs-ma-claim-organic-status-error-at-signoff': BOTH,
  'cs-ma-claim-parcel-based-options-not-verified': SITI_ONLY,
  'cs-ma-claim-parcels-not-under-control-of-sbi-at-signoff': BOTH,
  'cs-ma-claim-revenue-option-claim-rule-at-signoff': BOTH,
  'cs-ma-ed1-evidence-required': BOTH,
  'cs-ma-evidence-required': BOTH,
  'cs-revenue-claim-ppa-recovery-assessment-matrix': BOTH,
  'cs-revenue-claims-processing-to-final-payment-guide': BOTH,
  'cs-revenue-claims-supervisory-checks-guidance': BOTH,
  'final-payment-case-check-guide': BOTH,

  // Mock guides with text of their own
  'cs-revenue-claims-processing-final-payment-guide': BOTH,
  'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026': BOTH,
  'cs-ma-revenue-options-claim-rule-signoff-2026': BOTH,

  // Mock copies of real guides
  'cs-ma-evidence-required-2026': BOTH,
  'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026': BOTH,
  'cs-ma-claim-ab12-op3-maximum-eligible-weight-2026': BOTH,
  'cs-ma-claim-existing-2026': BOTH,
  'cs-ma-agreement-level-options-not-verified-2026': SITI_ONLY,
  'cs-ma-claim-refresh-signoff-check-2026': SITI_ONLY
}

// What the hub's filter calls each system.
const SYSTEM_LABELS = {
  [CRM]: 'CRM',
  [SITI_AGRI]: 'SITI Agri'
}

// The systems a guide needs, or [] if none is known.
function systemsOf(id) {
  return SYSTEMS_BY_GUIDE[id] || []
}

module.exports = { systemsOf, SYSTEM_LABELS, CRM, SITI_AGRI }
