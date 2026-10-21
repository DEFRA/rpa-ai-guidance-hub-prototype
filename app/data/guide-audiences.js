//
// Who each guide is for: processors (who work cases), team leaders (who
// allocate, check and sign off others' work) and editors (who write and
// maintain guidance). Read by the hub's "Who it's for" filter
// (playground/hub/view-model.js).
//
// The real guides (from the PoC API) were read on 2026-10-19 for who they
// address. Only one says so outright (the Admin Evidence Check:
// "Processors will do…"); the rest show it by voice. The case-working
// guides are for processors: "you" assign the case to yourself and work it,
// and the line some add for team leaders is a hand-off, not a procedure of
// their own. The two checking guides are for whoever checks and signs off
// others' work, by grade and delegated authority rather than role: team
// leaders is the nearest of the three.
//
// The mock guides' audiences are made up, to give the filter something
// plausible to narrow: case-working guides are for processors, sign-off and
// closing-rule guides also for team leaders, and a scheme being closed or
// rewritten also for editors. A guide not listed here has no audience yet.
//

const PROCESSORS = 'processors'
const TEAM_LEADERS = 'team-leaders'
const EDITORS = 'editors'

const AUDIENCES_BY_GUIDE = {
  // Real guides
  '2026-cs-ma-claim-admin-evidence-check': [PROCESSORS],
  'cs-ma-claim-ab12-or-op3-maximum-eligible-weight': [PROCESSORS],
  'cs-ma-claim-agreement-level-options-not-verified': [PROCESSORS],
  'cs-ma-claim-claim-refresh-signoff-check': [PROCESSORS],
  'cs-ma-claim-existing-mta': [PROCESSORS],
  'cs-ma-claim-in-checking-error': [PROCESSORS],
  'cs-ma-claim-land-use-or-land-cover-not-compatible-with-option-at-signoff': [
    PROCESSORS
  ],
  'cs-ma-claim-organic-status-error-at-signoff': [PROCESSORS],
  'cs-ma-claim-parcel-based-options-not-verified': [PROCESSORS],
  'cs-ma-claim-parcels-not-under-control-of-sbi-at-signoff': [PROCESSORS],
  'cs-ma-claim-revenue-option-claim-rule-at-signoff': [PROCESSORS],
  'cs-ma-ed1-evidence-required': [PROCESSORS],
  'cs-ma-evidence-required': [PROCESSORS],
  'cs-revenue-claim-ppa-recovery-assessment-matrix': [PROCESSORS],
  'cs-revenue-claims-processing-to-final-payment-guide': [PROCESSORS],
  'cs-revenue-claims-supervisory-checks-guidance': [TEAM_LEADERS],
  'final-payment-case-check-guide': [TEAM_LEADERS],

  // Mock guides
  'cs-revenue-claims-processing-final-payment-guide': [
    PROCESSORS,
    TEAM_LEADERS
  ],
  'sfi-integrated-pest-management-actions': [PROCESSORS],
  'cs-ma-evidence-required-2026': [PROCESSORS],
  'countryside-stewardship-capital-grants': [PROCESSORS, EDITORS],
  'basic-payment-scheme-closing-rules': [TEAM_LEADERS, EDITORS],
  'hedgerow-management-standards': [PROCESSORS],
  'cs-mid-tier-hedgerow-and-boundary-options': [PROCESSORS],
  'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026': [
    PROCESSORS,
    TEAM_LEADERS
  ],
  'sfi-soil-health-actions': [PROCESSORS],
  'sfi-nutrient-management-actions': [PROCESSORS],
  'cs-ma-claim-ab12-op3-maximum-eligible-weight-2026': [PROCESSORS],
  'cs-ma-claim-existing-2026': [PROCESSORS],
  'cs-higher-tier-wetland-and-grassland-options': [PROCESSORS],
  'cs-ma-revenue-options-claim-rule-signoff-2026': [PROCESSORS, TEAM_LEADERS],
  'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026': [
    PROCESSORS,
    TEAM_LEADERS
  ],
  'cs-ma-agreement-level-options-not-verified-2026': [PROCESSORS],
  'cs-ma-claim-refresh-signoff-check-2026': [PROCESSORS, TEAM_LEADERS]
}

// What the hub's filter calls each audience.
const AUDIENCE_LABELS = {
  [PROCESSORS]: 'Processors',
  [TEAM_LEADERS]: 'Team leaders',
  [EDITORS]: 'Editors'
}

// A guide's audiences, or [] if it has none yet.
function audiencesOf(id) {
  return AUDIENCES_BY_GUIDE[id] || []
}

module.exports = {
  audiencesOf,
  AUDIENCE_LABELS,
  PROCESSORS,
  TEAM_LEADERS,
  EDITORS
}
