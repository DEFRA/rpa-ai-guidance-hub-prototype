//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const prototypes = require('./lib/prototypes')
const library = require('./data/documents')
const { guidedSearches } = require('./data/guided-searches')
const { savedDocuments } = require('./data/saved-documents')
const { searchResults } = require('./data/search-results')
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

  // AI-guided searches already run, shown on find-guidance.html.
  res.locals.guidedSearches = guidedSearches

  // Documents saved from an organic search, also shown on find-guidance.html.
  res.locals.savedDocuments = savedDocuments

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

// The homepage: ask what the designer wants to do, then send them into
// whichever branch they choose. See app/views/start.html.
//
// This used to render app/views/index.html — every prototype version and the
// journeys inside it, for picking one to run in a research session. That page
// is still on disk but no longer routed anywhere now this is the one flow.
router.get('/', (req, res) => {
  // Starting fresh clears any variant left over from a previous run.
  delete req.session.data.activeJourney
  res.render('start')
})

router.post('/', (req, res) => {
  res.redirect(
    req.body.destination === 'find' ? '/find-guidance' : '/all-guidance-docs'
  )
})

// Not designed yet — a placeholder so "Find and locate guidance" leads
// somewhere rather than a 404. See app/views/find-guidance.html.
router.get('/find-guidance', (req, res) => {
  res.locals.backHref = '/'
  res.render('find-guidance')
})

// "Start a new search" — neither journey off it is designed yet, so both are
// placeholders. See app/views/find-guidance-new.html.
router.get('/find-guidance/new', (req, res) => {
  res.locals.backHref = '/find-guidance'
  res.render('find-guidance-new')
})

router.post('/find-guidance/new', (req, res) => {
  res.redirect(
    req.body.searchMethod === 'ai' ? '/find-guidance/ai-search' : '/find-guidance/organic-search'
  )
})

// Deleting a guided search from the list. A static prototype has nothing
// real to delete, so both buttons on the confirmation page just return to
// the list — see app/views/delete-search-confirm.html.
router.get('/find-guidance/delete/:id', (req, res) => {
  const search = guidedSearches.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/find-guidance'
  res.render('delete-search-confirm', {
    searchName: search ? search.name : 'this search'
  })
})

// A document's read-only view — opened from the "Saved documents" tab on
// find-guidance.html, or from a result on organic-search.html for a
// document not saved yet. Name and status come from app/data/saved-documents.js
// or, failing that, app/data/search-results.js; the section content itself
// is fixed placeholder text local to app/views/saved-document-view.html, one
// set per document id, covering both sources.
router.get('/find-guidance/document/:id', (req, res) => {
  const document =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/find-guidance'
  res.render('saved-document-view', {
    id: req.params.id,
    documentName: document ? document.name : 'Document not found',
    status: document ? document.status : 'Up to date'
  })
})

// Search by document name, date or type. The search bar and filters are not
// wired up to anything real — see app/views/organic-search.html — so this
// always shows the same fixed set of example results.
router.get('/find-guidance/organic-search', (req, res) => {
  res.locals.backHref = '/find-guidance/new'
  res.render('organic-search', { results: searchResults })
})

// Search by explaining the problem, rather than by document. See
// app/views/ai-search.html.
router.get('/find-guidance/ai-search', (req, res) => {
  res.locals.backHref = '/find-guidance/new'
  res.render('ai-search')
})

// Shown if ai-search-results.html is reached without going through the form
// first — stepping back and forward, or a direct link — so the heading is
// never blank.
const DEFAULT_AI_SEARCH_QUERY =
  'I need to understand what evidence is required for the upland grazing option under SFI 23'

// The wait between submitting a query and seeing results. Nothing here is a
// real search yet, so this only remembers the query text — for
// ai-search-results.html's heading — and gives the designer something to
// look at while "analysing" it. Redirects to the GET route below rather than
// rendering directly, the same POST-then-GET shape every form in this
// prototype follows, so refreshing the loading page does not resubmit it.
router.post('/find-guidance/ai-search-loading', (req, res) => {
  req.session.data.aiSearchQuery = (req.body.query || '').trim()
  res.redirect('/find-guidance/ai-search-loading')
})

router.get('/find-guidance/ai-search-loading', (req, res) => {
  res.render('ai-search-loading')
})

// Results of an AI search, stepped through one at a time. The guidance text,
// additional information and references are all fixed placeholder content —
// see app/views/ai-search-results.html.
//
// Reached two ways: fresh from the form on ai-search.html (no :id — a query
// just typed in, held in the session, always 4 steps starting at step 1,
// the same shape as sfi-eligibility below); or resumed from a row in the
// "Guided searches" tab on find-guidance.html (:id identifies which of the
// fixed example searches this is, from app/data/guided-searches.js, which
// says how many steps it has and which one it resumes at — a search a
// couple of steps in does not restart from step 1).
const DEFAULT_TOTAL_STEPS = 4
const DEFAULT_STEP = 1

function renderAiSearchResults (req, res) {
  const search = guidedSearches.find((candidate) => candidate.id === req.params.id)
  const id = search ? search.id : 'new'
  const totalSteps = search ? search.totalSteps : DEFAULT_TOTAL_STEPS
  const startingStep = search ? search.resumeStep : DEFAULT_STEP

  const step = Math.min(
    Math.max(Number(req.params.step) || startingStep, 1),
    totalSteps
  )

  res.render('ai-search-results', {
    id,
    step,
    totalSteps,
    query: req.session.data.aiSearchQuery || DEFAULT_AI_SEARCH_QUERY,
    // Drives the "Back" button next to Complete/Incomplete, which moves
    // between steps. Step 1's back goes to the search itself for a fresh
    // query, rather than a step 0 — but a resumed search did not come from
    // there, so it goes to the saved-searches list instead.
    backHref:
      step > 1
        ? `/find-guidance/ai-search-results/${id}/${step - 1}`
        : (search ? '/find-guidance' : '/find-guidance/ai-search'),
    // Drives the govukBackLink at the top instead — the saved-searches list,
    // not a step. See the comment on resolvedBackHref in layouts/main.html.
    backLinkHref: '/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps ? `/find-guidance/ai-search-results/${id}/${step + 1}` : '/find-guidance'
  })
}

router.get('/find-guidance/ai-search-results', renderAiSearchResults)
router.get('/find-guidance/ai-search-results/:id', renderAiSearchResults)
router.get('/find-guidance/ai-search-results/:id/:step', renderAiSearchResults)

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

// All guidance documents in the hub, tabbed by status. See
// app/views/all-guidance-docs.html.
router.get('/all-guidance-docs', (req, res) => {
  res.locals.backHref = '/'
  res.render('all-guidance-docs')
})

// A single guidance document's overview. Placeholder until the content panel
// is designed — see app/views/guidance-document.html.
router.get('/guidance-document/:id', (req, res) => {
  res.locals.backHref = '/all-guidance-docs'
  res.render('guidance-document')
})

// A recommended change, opened from the guidance document overview. The
// document text, the finding shown and this count are all fixed placeholder
// content — see app/views/change-review.html — but the count matches the
// severity totals shown there (3 high + 5 medium + 2 low), so paging through
// issue numbers stops at a sensible boundary until real issue data exists.
const TOTAL_REVIEW_ISSUES = 10

function renderChangeReview (req, res) {
  const id = req.params.id
  const issueNumber = Math.min(
    Math.max(Number(req.params.issueNumber) || 1, 1),
    TOTAL_REVIEW_ISSUES
  )

  res.locals.backHref = `/guidance-document/${id}`

  res.render('change-review', {
    issueNumber,
    totalIssues: TOTAL_REVIEW_ISSUES,
    previousIssueHref:
      issueNumber > 1 ? `/guidance-document/${id}/review/${issueNumber - 1}` : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES ? `/guidance-document/${id}/review/${issueNumber + 1}` : null
  })
}

router.get('/guidance-document/:id/review', renderChangeReview)
router.get('/guidance-document/:id/review/:issueNumber', renderChangeReview)

// Overrides just the back link on this one step of the migrate journey — it
// otherwise comes from prototypes.findStep() via the router.use() above,
// which would send it back to the dashboard. Nothing else about the step
// (journey banner, nextHref) changes, since that middleware still runs
// first and sets everything else as normal.
router.get('/designer/migrate/single/upload', (req, res) => {
  res.locals.backHref = '/all-guidance-docs'
  res.render('designer/migrate/single/upload')
})

// Add your routes here
