// The upload journey — a de-versioned port of /v6/create-guidance's own
// port of V4's /v4/upload-guide/* flow. The consolidation plan dropped the
// "What would you like to do?" choice page that used to sit in front of
// this: the hub's "Upload guide" button now lands straight on the upload
// step below, and "Create a new guide"/"Update existing guide" are out of
// scope for this consolidation entirely.

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
// entry of its own (see converted.njk's own comment), so every conversion
// is hardcoded to this one existing document rather than inventing
// draft-persistence this build wasn't asked for.
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
// "Type of guidance" (see check.njk's own comment): it was never asked
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

function getUpload(req, res) {
  res.locals.backHref = '/consolidated/hub'
  res.render('consolidated/upload/upload.njk')
}

// A new upload is a new guide, so any details left in session from a
// previous run are cleared.
function postUpload(req, res) {
  delete req.session.data.consolidatedUploadedGuide
  res.redirect('/consolidated/upload/processing')
}

function getProcessing(req, res) {
  res.render('consolidated/upload/processing.njk')
}

// Step 1 of 2 — the facts read from the document plus the scheme(s) this
// guidance relates to. Reachable via a Change link from the check page
// (?from=check), carried through as a hidden field so Continue returns
// there instead of carrying on.
function getDetails(req, res) {
  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check' ? '/consolidated/upload/check' : '/consolidated/upload'
  res.render('consolidated/upload/details.njk', {
    details: uploadedGuide(req),
    errors: {},
    errorList: [],
    from
  })
}

function postDetails(req, res) {
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
    errors.scheme = {
      text: "Select the schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check' ? '/consolidated/upload/check' : '/consolidated/upload'
    return res.render('consolidated/upload/details.njk', {
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
  details.scheme = scheme
  req.session.data.consolidatedUploadedGuide = details

  res.redirect(
    from === 'check'
      ? '/consolidated/upload/check'
      : '/consolidated/upload/owner'
  )
}

// Step 2 of 2 — owner, purpose, required knowledge/training, systems, and
// who it is for. A direct visit with no upload started yet falls back to
// the details step.
function getOwner(req, res) {
  if (!req.session.data.consolidatedUploadedGuide) {
    return res.redirect('/consolidated/upload/details')
  }

  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check'
      ? '/consolidated/upload/check'
      : '/consolidated/upload/details'
  res.render('consolidated/upload/owner.njk', {
    details: req.session.data.consolidatedUploadedGuide,
    errors: {},
    errorList: [],
    from
  })
}

function postOwner(req, res) {
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
        ? '/consolidated/upload/check'
        : '/consolidated/upload/details'
    return res.render('consolidated/upload/owner.njk', {
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

  const details = uploadedGuide(req)
  details.owner = owner
  details.goal = goal
  details.requirements = requirements
  details.systems = systems
  details.audience = audience
  req.session.data.consolidatedUploadedGuide = details

  res.redirect('/consolidated/upload/check')
}

// The check page before converting — everything on two summary cards,
// with Change links back to whichever step owns those fields.
function getCheck(req, res) {
  const details = req.session.data.consolidatedUploadedGuide
  if (!details) return res.redirect('/consolidated/upload')

  const listOr = (values, labels, fallback) => {
    const named = (values || []).map((value) => labels[value]).filter(Boolean)
    return named.length ? named.join(', ') : fallback
  }

  res.locals.backHref = '/consolidated/upload/owner'
  res.render('consolidated/upload/check.njk', {
    details,
    schemeLabel: listOr(details.scheme, V4_SCHEMES, 'Not scheme-specific'),
    audienceLabel: listOr(details.audience, V4_AUDIENCE, 'Not provided'),
    systemsLabel: listOr(details.systems, V4_SYSTEMS, 'None')
  })
}

function postCheck(req, res) {
  res.redirect('/consolidated/upload/converted')
}

// The success page — reached via the POST-then-GET redirect above, so
// refreshing doesn't resubmit.
function getConverted(req, res) {
  const details = req.session.data.consolidatedUploadedGuide
  if (!details) return res.redirect('/consolidated/upload')

  res.render('consolidated/upload/converted.njk', {
    guideName: details.name,
    guideId: CONVERTED_GUIDE_ID
  })
}

module.exports = {
  getUpload,
  postUpload,
  getProcessing,
  getDetails,
  postDetails,
  getOwner,
  postOwner,
  getCheck,
  postCheck,
  getConverted
}
