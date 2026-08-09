//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const prototypes = require('./lib/prototypes')
const library = require('./data/documents')
const sampleDocument = require('./data/sample-document')
// Shared with the browser — see the scripts block in app/views/layouts/main.html.
const qualityChecks = require('./assets/javascripts/quality-checks')

// Verdicts a designer can record against a finding, following the pattern in
// the POC front end (DEFRA/ai-uc-rpa-guidance-fe, components/feedback-form).
const VERDICTS = {
  fixed: { text: 'Fixed', classes: 'govuk-tag--green' },
  wont_fix: { text: "Won't fix", classes: 'govuk-tag--grey' },
  false_positive: { text: 'False positive', classes: 'govuk-tag--blue' }
}

// Items for the Defra service navigation bar. Leave this empty and the header
// shows a plain green brand border instead. Once the information architecture
// is agreed, add entries such as:
//
//   { text: 'Home', href: '/' },
//   { text: 'Guidance', href: '/guidance' }
//
const navigation = []

// Make the navigation available to every page, marking the current item so it
// gets aria-current="page" and the active underline.
router.use((req, res, next) => {
  res.locals.navigation = navigation.map((item) => ({
    ...item,
    current: item.href === req.path
  }))
  next()
})

// Work out whether the page being served is a step in a journey. If it is, the
// layout can show which version and step the participant is on, and pages get a
// back link and a `nextHref` without hardcoding the sequence in the template.
router.use((req, res, next) => {
  req.session.data = req.session.data || {}

  // Links from the index carry ?j=<journey id>. Remembering it means pages
  // shared between variants — sign in, the landing page — keep the participant
  // on the variant they were started on.
  if (req.query.j) {
    req.session.data.activeJourney = req.query.j
  }

  const activeJourney = req.session.data.activeJourney
  const location = prototypes.findStep(req.path, activeJourney)

  if (location) {
    res.locals.journey = location.journey
    res.locals.journeyVersion = location.version
    res.locals.journeyStep = location.step
    res.locals.journeyAlternative = location.alternative
    res.locals.backHref = location.previous && location.previous.path
    res.locals.nextHref = location.next && location.next.path
    res.locals.nextName = location.next && location.next.name
  }

  // Used by the landing page, where the designer chooses a branch.
  res.locals.migrateHref = prototypes.getBranchStart('migrate', activeJourney)
  res.locals.editHref = prototypes.getBranchStart('edit', activeJourney)

  // Guidance documents in the hub, shared by every designer page.
  res.locals.library = library

  // Two ways of working through the same findings: open the editor and fix them
  // as you see fit, or step through them one at a time recording a verdict on
  // each.
  //
  // In a research session only one should be on offer, so a participant is not
  // choosing between designs we are trying to compare. Outside one — browsing
  // the prototype, or arriving from a migrate journey — both are shown, because
  // otherwise the step-through is unreachable unless you happen to enter
  // through exactly the right door.
  const fixVariant = /fix-step-through/.test(activeJourney || '')
    ? 'step-through'
    : /fix-editor/.test(activeJourney || '')
      ? 'editor'
      : null

  res.locals.fixVariant = fixVariant
  res.locals.steppingThrough = fixVariant === 'step-through'
  res.locals.fixHref = prototypes.getBranchStart('fix', activeJourney)
  res.locals.editorHref = '/designer/documents/edit'
  res.locals.stepThroughHref = '/designer/documents/findings'

  // The document under edit, and what the quality checks make of it.
  const verdicts = req.session.data.verdicts || {}
  const issues = qualityChecks.findIssues(sampleDocument).map((issue) => ({
    ...issue,
    verdict: verdicts[issue.id] && verdicts[issue.id].verdict,
    verdictTag: verdicts[issue.id] && VERDICTS[verdicts[issue.id].verdict],
    comment: verdicts[issue.id] && verdicts[issue.id].comment,
    // In the editor variant a finding is a place to go. Everywhere else it is
    // a page of its own, which also offers a way into the editor — so a single
    // finding is reachable in full whichever route the reader is on.
    href: fixVariant === 'editor'
      ? `/designer/documents/edit?line=${issue.line}`
      : `/designer/documents/findings/${issue.id}`
  }))

  const outstanding = issues.filter((issue) => !issue.verdict)
  const resolved = issues.filter((issue) => issue.verdict)

  // Counted here rather than in the template: Nunjucks has no dictionary update
  // method, so tallying in a loop is Jinja2 syntax that quietly fails here.
  const verdictCounts = Object.keys(VERDICTS).reduce((counts, verdict) => {
    counts[verdict] = resolved.filter((issue) => issue.verdict === verdict).length
    return counts
  }, {})

  res.locals.document = {
    markdown: sampleDocument,
    issues,
    outstanding,
    resolved,
    verdictCounts,
    counts: qualityChecks.severityCounts(issues),
    outstandingCounts: qualityChecks.severityCounts(outstanding),
    split: qualityChecks.split(issues)
  }

  next()
})

// The landing page: every version of the prototype and the journeys inside it.
router.get('/', (req, res) => {
  // Starting from the index clears any variant left over from a previous run.
  delete req.session.data.activeJourney

  res.render('index', {
    currentVersion: prototypes.getCurrentVersion(),
    previousVersions: prototypes.getPreviousVersions()
  })
})

// -- Stepping through the findings one at a time ---------------------------
//
// A sub-journey off the quality issues page. Each finding gets a page of its
// own with the rule it came from, where it is, why it matters and what to do —
// and a verdict, so a designer can dispose of a finding they disagree with
// rather than being stuck with it.

function findingOr404 (req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue) res.status(404).render('designer/documents/finding-not-found')
  return issue
}

router.get('/designer/documents/findings/:id', (req, res) => {
  const issue = findingOr404(req, res)
  if (!issue) return

  const { issues } = res.locals.document
  const position = issues.indexOf(issue)

  res.render('designer/documents/finding', {
    finding: issue,
    position: position + 1,
    total: issues.length,
    previousFinding: issues[position - 1],
    nextFinding: issues[position + 1]
  })
})

router.post('/designer/documents/findings/:id', (req, res) => {
  const issue = findingOr404(req, res)
  if (!issue) return

  // Only a verdict the service knows about. Anything else is dropped rather
  // than stored, which keeps the summary counts and the tag lookup honest.
  if (!Object.prototype.hasOwnProperty.call(VERDICTS, req.body.verdict)) {
    return res.redirect(`/designer/documents/findings/${issue.id}`)
  }

  req.session.data.verdicts = req.session.data.verdicts || {}
  req.session.data.verdicts[issue.id] = {
    verdict: req.body.verdict,
    comment: (req.body.comment || '').trim()
  }

  // Straight on to the next finding with no verdict yet, so the designer keeps
  // moving rather than being returned to the list after every one.
  const next = res.locals.document.issues.find(
    (candidate) => candidate.id !== issue.id && !candidate.verdict
  )

  res.redirect(
    next
      ? `/designer/documents/findings/${next.id}`
      : '/designer/documents/review-complete'
  )
})

// Start the sub-journey at the first finding with no verdict yet.
router.get('/designer/documents/findings', (req, res) => {
  const next = res.locals.document.outstanding[0]
  res.redirect(
    next
      ? `/designer/documents/findings/${next.id}`
      : '/designer/documents/review-complete'
  )
})

// Clears recorded verdicts, so a session can be run again from the index.
router.get('/designer/documents/review-reset', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/designer/documents/issues')
})

// Add your routes here
