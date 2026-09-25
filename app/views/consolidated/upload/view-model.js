// The upload journey — a de-versioned port of /v6/create-guidance's own
// port of V4's /v4/upload-guide/* flow. The consolidation plan dropped the
// "What would you like to do?" choice page that used to sit in front of
// this: the hub's "Upload guide" button now lands straight on the upload
// step, and "Create a new guide"/"Update existing guide" are out of scope
// for this consolidation entirely.
//
// Shared across the upload flow's steps (details/owner/check/converted),
// same as hub/view-model.js is shared across the hub's own child pages.

const V4_SCHEMES = {
  sfi: 'Sustainable Farming Incentive (SFI)',
  'countryside-stewardship': 'Countryside Stewardship (CS)',
  'cross-compliance': 'Cross Compliance',
  'basic-payment-scheme': 'Basic Payment Scheme (BPS)'
}
const V4_SCHEME_VALUES = Object.assign({ none: true }, V4_SCHEMES)
const V4_AUDIENCE = {
  processor: 'Processor',
  'team-leader': 'Team leader',
  'technical-specialist': 'Technical specialist',
  manager: 'Manager',
  other: 'Other'
}
const V4_SYSTEMS = {
  crm: 'CRM',
  agri: 'SITI Agri',
  d365: 'D365',
  genesis: 'Genesis',
  lms: 'Land Management Services',
  rpa: 'RPA Application Portal',
  rps: 'Rural Payments Service',
  inspections: 'Inspections Workbench',
  imis: 'IMIS'
}

const UPLOAD_DEFAULT_TITLE =
  'Processing farmer claims using RPA processors and legacy systems'
const UPLOAD_VERSION = '1.0'
const UPLOAD_LAST_MODIFIED = '29 June 2026'

// "View the guidance" on the converted page needs a real document id to
// open the document overview page — this flow never creates a tracked
// entry of its own (see converted/controller.js's own comment), so every
// conversion is hardcoded to this one existing document rather than
// inventing draft-persistence this build wasn't asked for.
//
// sfi-nutrient-management-actions (one of MANAGE_GUIDANCE_PUBLISHED_SAMPLES
// in app/data/manage-guidance.js, not a guidanceDocuments.js entry) is the
// pick, not the more obviously "on-theme" sfi-soil-health-actions — that
// one is actually one of manage-guidance.js's fixed Awaiting approval
// sample titles, and document/page.njk deliberately gives Awaiting
// approval no Edit button. sfi-nutrient-management-actions is genuinely
// Published, so the overview page gets its real View/Edit buttons — Edit
// moves it into Draft for the rest of the session via the normal
// start-editing route, same as any other Published sample.
const CONVERTED_GUIDE_ID = 'sfi-nutrient-management-actions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function selected(value, allowed) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.filter((candidate) => allowed[candidate])
}

// Seeds with the facts "read from the document" (title/version/date) plus
// everything else empty. No `type` field — the consolidation plan dropped
// "Type of guidance" (see check/page.njk's own comment): it was never asked
// anywhere upstream, just a hardcoded value with no real question behind
// it.
function uploadedGuide(req) {
  return (
    req.session.data.consolidatedUploadedGuide || {
      name: UPLOAD_DEFAULT_TITLE,
      version: UPLOAD_VERSION,
      lastModified: UPLOAD_LAST_MODIFIED,
      scheme: [],
      owner: '',
      audience: [],
      goal: '',
      requirements: '',
      systems: []
    }
  )
}

module.exports = {
  V4_SCHEMES,
  V4_SCHEME_VALUES,
  V4_AUDIENCE,
  V4_SYSTEMS,
  UPLOAD_VERSION,
  UPLOAD_LAST_MODIFIED,
  CONVERTED_GUIDE_ID,
  EMAIL_RE,
  selected,
  uploadedGuide
}
