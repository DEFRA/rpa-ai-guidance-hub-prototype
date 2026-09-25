// v6's own port of two things:
//   1. v2's create-guidance.html ("what would you like to do?") — see
//      get/post below.
//   2. v4's /v4/upload-guide/* flow (app/views/versions/v4/upload-*.html,
//      the metadata/validation logic in app/views/legacy/routes.js) —
//      duplicated wholesale, not shared or redirected into: v4 is frozen,
//      and its own converted page hardcodes links to v4's own read-only
//      viewer and restart page, which this flow cannot end on without
//      breaking the "view/edit in draft state" requirement it was built
//      to meet. Field names, validation rules and copy below are a
//      direct port of v4's own (V4_SCHEMES/V4_AUDIENCE/V4_SYSTEMS/
//      V4_EMAIL_RE/v4Details/v4Selected, legacy/routes.js ~line 2920+) —
//      not reused by reference (nothing there is exported), reimplemented
//      here under this module's own names and its own session key
//      (req.session.data.v6UploadedGuide, not v4's v4UploadedGuide — kept
//      separate so using both flows in the same browser session can never
//      corrupt each other's in-progress upload).
//
// Deliberate differences from v4, per the task this was built from:
//   - "View the guidance" on the converted page goes to
//     /v6/editor-2-3-view (genuinely editable — the v6 editor entry point,
//     every such link across v6 now points here rather than at
//     /v6/editor-experiment) rather than v4's own
//     read-only guide-view.html — v4's own page explicitly says "no
//     editing" there, which the task asked v6 not to repeat. No ?id= is
//     passed (falls back to that route's existing fixed sample content,
//     the same fallback branch "Review and fix the issues" already used
//     on the retired v2-based version of this flow) — this does not
//     create a real tracked Draft document (it won't appear on the
//     unified hub's own Editing tab), a deliberate scope choice confirmed
//     directly rather than assumed.
//   - No file-rejection page: v4's own flow has none either (its
//     app-progress widget's data-rejected attribute, where one exists
//     elsewhere in this app, is dead markup regardless — see the retired
//     v2-based version of this flow's own history for that finding), so
//     none is invented here.

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function selected(value, allowed) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.filter((candidate) => allowed[candidate])
}

// Seeds with the facts "read from the document" (title/version/date) plus
// everything else empty — merged into across both metadata steps, so a
// Change link back to either one leaves the other's fields untouched.
function uploadedGuide(req) {
  return (
    req.session.data.v6UploadedGuide || {
      name: UPLOAD_DEFAULT_TITLE,
      version: UPLOAD_VERSION,
      lastModified: UPLOAD_LAST_MODIFIED,
      scheme: [],
      owner: '',
      type: 'Process guide',
      audience: [],
      goal: '',
      requirements: '',
      systems: []
    }
  )
}

function get(req, res) {
  res.locals.backHref = '/v6/unified-guidance'
  res.render('v6/create-guidance/page.njk', {
    selected: '',
    errors: {},
    errorList: []
  })
}

// "Create a new guide"/"Update existing guide" deliberately go nowhere
// yet (placeholder, per the task this was built from) — re-rendering the
// same page with the choice preserved, not a redirect and not an error.
function post(req, res) {
  const choice = req.body.createGuidance || ''

  if (!choice) {
    res.locals.backHref = '/v6/unified-guidance'
    const errors = {
      createGuidance: {
        text: 'Select what you would like to do',
        href: '#create-guidance'
      }
    }
    return res.render('v6/create-guidance/page.njk', {
      selected: choice,
      errors,
      errorList: Object.values(errors)
    })
  }

  if (choice === 'upload') {
    return res.redirect('/v6/create-guidance/upload')
  }

  res.locals.backHref = '/v6/unified-guidance'
  res.render('v6/create-guidance/page.njk', {
    selected: choice,
    errors: {},
    errorList: []
  })
}

function getUpload(req, res) {
  res.locals.backHref = '/v6/create-guidance'
  res.render('v6/create-guidance/upload.njk')
}

// A new upload is a new guide, so any details left in session from a
// previous run are cleared — the metadata step then starts fresh (title
// back to the document-read default, owner blank). The file itself goes
// nowhere in a static prototype.
function postUpload(req, res) {
  delete req.session.data.v6UploadedGuide
  res.redirect('/v6/create-guidance/processing')
}

function getProcessing(req, res) {
  res.render('v6/create-guidance/processing.njk')
}

// Step 1 of 2 — the facts read from the document (title editable; version
// and date read-only) plus the scheme(s) this guidance relates to. Either
// step can also be reached via a Change link from the check page
// (?from=check); when that's how it was opened, the flag carries through
// the form as a hidden field so Continue — and the back link — return
// straight to check instead of carrying on through the rest of the flow.
function getMetadata(req, res) {
  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check'
      ? '/v6/create-guidance/check'
      : '/v6/create-guidance/upload'
  res.render('v6/create-guidance/metadata.njk', {
    details: uploadedGuide(req),
    errors: {},
    errorList: [],
    from
  })
}

function postMetadata(req, res) {
  const title = (req.body.guideTitle || '').trim()
  const scheme = selected(req.body.scheme, V4_SCHEME_VALUES)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!title) {
    errors.guideTitle = { text: 'Enter a guidance title', href: '#guide-title' }
  }
  if (!scheme.length) {
    errors.scheme = {
      text: "Select the scheme or schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  } else if (scheme.includes('none') && scheme.length > 1) {
    // No-JS fallback: the exclusive behaviour on "none" is client-side
    // only, so a form submitted without it can still carry both.
    errors.scheme = {
      text: "Select the schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check'
        ? '/v6/create-guidance/check'
        : '/v6/create-guidance/upload'
    return res.render('v6/create-guidance/metadata.njk', {
      details: Object.assign({}, uploadedGuide(req), { name: title, scheme }),
      errors,
      errorList: Object.values(errors),
      from
    })
  }

  const details = uploadedGuide(req)
  details.name = title
  details.version = UPLOAD_VERSION
  details.lastModified = UPLOAD_LAST_MODIFIED
  details.type = 'Process guide'
  details.scheme = scheme
  req.session.data.v6UploadedGuide = details

  res.redirect(
    from === 'check'
      ? '/v6/create-guidance/check'
      : '/v6/create-guidance/metadata/purpose'
  )
}

// Step 2 of 2 — who owns it, what it aims to achieve, required knowledge/
// training, the systems it uses, and who it is for. A direct visit with
// no upload started yet falls back to the metadata step, same as v4.
function getMetadataPurpose(req, res) {
  if (!req.session.data.v6UploadedGuide) {
    return res.redirect('/v6/create-guidance/metadata')
  }

  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check'
      ? '/v6/create-guidance/check'
      : '/v6/create-guidance/metadata'
  res.render('v6/create-guidance/metadata-purpose.njk', {
    details: req.session.data.v6UploadedGuide,
    errors: {},
    errorList: [],
    from
  })
}

function postMetadataPurpose(req, res) {
  const owner = (req.body.owner || '').trim()
  const goal = (req.body.goal || '').trim()
  const requirements = (req.body.requirements || '').trim()
  const systems = selected(req.body.systems, V4_SYSTEMS)
  const audience = selected(req.body.audience, V4_AUDIENCE)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!owner) {
    errors.owner = { text: 'Enter the owner email address', href: '#owner' }
  } else if (!EMAIL_RE.test(owner)) {
    errors.owner = {
      text: 'Enter an email address in the correct format, like name@example.com',
      href: '#owner'
    }
  }
  if (!goal) {
    errors.goal = { text: 'Enter the purpose of this guidance', href: '#goal' }
  }
  if (!requirements) {
    errors.requirements = {
      text: 'Enter the required knowledge and training',
      href: '#requirements'
    }
  }
  if (!systems.length) {
    errors.systems = {
      text: 'Select the systems this guidance will use',
      href: '#systems'
    }
  }
  if (!audience.length) {
    errors.audience = {
      text: 'Select who this guidance is for',
      href: '#audience'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check'
        ? '/v6/create-guidance/check'
        : '/v6/create-guidance/metadata'
    return res.render('v6/create-guidance/metadata-purpose.njk', {
      details: Object.assign({}, uploadedGuide(req), {
        owner,
        goal,
        requirements,
        systems,
        audience
      }),
      errors,
      errorList: Object.values(errors),
      from
    })
  }

  // Already the last step, so Continue always lands on check regardless
  // of `from` — but the flag still governs the back link above, for
  // consistency with step 1.
  const details = uploadedGuide(req)
  details.owner = owner
  details.goal = goal
  details.requirements = requirements
  details.systems = systems
  details.audience = audience
  req.session.data.v6UploadedGuide = details

  res.redirect('/v6/create-guidance/check')
}

// The check page before converting — everything on two summary cards,
// with Change links back to whichever step owns those fields.
function getCheck(req, res) {
  const details = req.session.data.v6UploadedGuide
  if (!details) return res.redirect('/v6/create-guidance/upload')

  const listOr = (values, labels, fallback) => {
    const named = (values || []).map((value) => labels[value]).filter(Boolean)
    return named.length ? named.join(', ') : fallback
  }

  res.locals.backHref = '/v6/create-guidance/metadata/purpose'
  res.render('v6/create-guidance/check.njk', {
    details,
    typeLabel: details.type,
    // "none" isn't in V4_SCHEMES, so listOr drops it and falls back to
    // "Not scheme-specific" whenever that's the only value selected.
    schemeLabel: listOr(details.scheme, V4_SCHEMES, 'Not scheme-specific'),
    audienceLabel: listOr(details.audience, V4_AUDIENCE, 'Not provided'),
    systemsLabel: listOr(details.systems, V4_SYSTEMS, 'None')
  })
}

function postCheck(req, res) {
  res.redirect('/v6/create-guidance/converted')
}

// The success page — reached via the POST-then-GET redirect above, so
// refreshing doesn't resubmit. No quality checks run (matching v4), so
// this confirms the conversion rather than sending the designer to fix
// findings.
function getConverted(req, res) {
  const details = req.session.data.v6UploadedGuide
  if (!details) return res.redirect('/v6/create-guidance/upload')

  res.render('v6/create-guidance/converted.njk', { guideName: details.name })
}

module.exports = {
  get,
  post,
  getUpload,
  postUpload,
  getProcessing,
  getMetadata,
  postMetadata,
  getMetadataPurpose,
  postMetadataPurpose,
  getCheck,
  postCheck,
  getConverted
}
