//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const prototypes = require('./lib/prototypes')
const library = require('./data/documents')
const { guidedSearches } = require('./data/guided-searches')
const { favouritedGuidance } = require('./data/favourited-guidance')
const { savedDocuments } = require('./data/saved-documents')
const { searchResults } = require('./data/search-results')
const { documentOverviews } = require('./data/document-overviews')
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

  // Guidance documents favourited for quick access, also shown on
  // find-guidance.html.
  res.locals.favouritedGuidance = favouritedGuidance

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

// The versions list — repurposing app/views/index.html for that, rather than
// the multi-version/journey browser it originally was. Now the root: Version
// 2 (current) lives at /v2/start below, so nothing here is self-referential
// any more, and this no longer needs a separate /index to avoid colliding
// with the live homepage's own job at "/".
router.get('/', (req, res) => {
  res.render('index')
})

// The homepage: what the designer wants to do, as a list of direct links
// rather than a question with a Continue button. See app/views/start.html.
//
// Namespaced under /v2/ — Version 2 (current) — now that "/" is the versions
// list above rather than this page. Every live-flow link that used to point
// to "/" for this now points here instead.
router.get('/v2/start', (req, res) => {
  // Starting fresh clears any variant left over from a previous run.
  delete req.session.data.activeJourney
  res.render('start')
})

// Not designed yet — a placeholder so "Find and locate guidance" leads
// somewhere rather than a 404. See app/views/find-guidance.html.
router.get('/find-guidance', (req, res) => {
  res.locals.backHref = '/v2/start'
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

// Deleting a guided search or a favourited document from the list. A static
// prototype has nothing real to delete, so both buttons on the confirmation
// page just return to the list — see app/views/delete-search-confirm.html.
//
// Wording differs by source: Recently opened rows say "remove" (see
// find-guidance.html), Favourited guidance rows keep the original "delete"
// wording unchanged — same default an unmatched id already fell back to.
router.get('/find-guidance/delete/:id', (req, res) => {
  const guidedSearch = guidedSearches.find((candidate) => candidate.id === req.params.id)
  const favourite = favouritedGuidance.find((candidate) => candidate.id === req.params.id)
  const match = guidedSearch || favourite

  res.locals.backHref = '/find-guidance'
  res.render('delete-search-confirm', {
    searchName: match ? match.name : 'this search',
    verb: guidedSearch ? 'remove' : 'delete'
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

// A stop between a result on organic-search.html and the document itself
// (saved-document-view.html, at /find-guidance/document/:id) — see
// app/views/document-overview.html. id matches app/data/search-results.js,
// which also covers the three ids also in app/data/saved-documents.js.
router.get('/document-overview/:id', (req, res) => {
  const result = searchResults.find((candidate) => candidate.id === req.params.id)
  const overview = documentOverviews[req.params.id] || {}

  res.locals.backHref = '/find-guidance/organic-search'
  res.render('document-overview', {
    id: req.params.id,
    documentName: result ? result.name : 'Document not found',
    description: result ? result.description : '',
    status: result ? result.status : 'Up to date',
    scheme: overview.scheme || '',
    type: overview.type || '',
    lastUpdated: overview.lastUpdated || ''
  })
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
  res.locals.backHref = '/v2/start'
  res.render('all-guidance-docs')
})

// "Create guidance" on all-guidance-docs.html — which of three ways in.
// See app/views/create-guidance.html.
router.get('/create-guidance', (req, res) => {
  res.locals.backHref = '/all-guidance-docs'
  res.render('create-guidance')
})

router.post('/create-guidance', (req, res) => {
  if (req.body.createGuidance === 'create-new') {
    return res.redirect('/designer/migrate/single/new-guide-purpose')
  }

  if (req.body.createGuidance === 'update-existing') {
    return res.redirect('/designer/update-existing-guide')
  }

  // "Upload guidance" — captures metadata first, then continues into the
  // existing upload flow. See app/views/designer/migrate/single/metadata.html.
  res.redirect('/designer/migrate/single/metadata')
})

// A single guidance document's overview. Placeholder until the content panel
// is designed — see app/views/guidance-document.html.
router.get('/guidance-document/:id', (req, res) => {
  res.locals.backHref = '/all-guidance-docs'
  res.render('guidance-document')
})

// Matches the slug all-guidance-docs.html builds for each Recently added
// row's Edit link (document.name | lower | replace(":", "") | replace(" ", "-")),
// so the id in the URL can be traced back to which row was actually clicked.
function slugify (name) {
  return name.toLowerCase().replace(/:/g, '').replace(/ /g, '-')
}

// Straight into the markdown editor for a document, from the "Edit" button
// on a Recently added row — :id is only ever used to build this href
// (per-row, from the document's name, see all-guidance-docs.html). There is
// no per-document markdown yet, so every route into the editor still shares
// the one placeholder document/text — but the heading itself should match
// whichever row was clicked, so the id is matched back to its row here.
// See app/views/guidance-document-edit.html.
router.get('/guidance-document/:id/edit', (req, res) => {
  const uploaded = library.batch.find((document) => slugify(document.name) === req.params.id)

  res.locals.backHref = '/all-guidance-docs'
  res.render('guidance-document-edit', {
    documentName: uploaded ? uploaded.name : library.current.name,
    documentPages: uploaded ? uploaded.pages : library.current.pages
  })
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

// Captures a bit of context about the guidance before the existing upload
// flow starts — inserted between "Upload guidance" on create-guidance.html
// and the upload screen below. See
// app/views/designer/migrate/single/metadata.html.
router.get('/designer/migrate/single/metadata', (req, res) => {
  res.render('designer/migrate/single/metadata')
})

router.post('/designer/migrate/single/metadata', (req, res) => {
  req.session.data.guidanceType = req.body.guidanceType
  req.session.data.guidanceTitle = (req.body.guidanceTitle || '').trim()
  req.session.data.guidanceAudience = (req.body.guidanceAudience || '').trim()
  req.session.data.guidanceGoal = (req.body.guidanceGoal || '').trim()
  req.session.data.guidanceRequirements = (req.body.guidanceRequirements || '').trim()
  req.session.data.guidanceSystemAccess = req.body.systemAccess

  res.redirect(res.locals.migrateHref)
})

// Overrides just the back link on this one step of the migrate journey — it
// otherwise comes from prototypes.findStep() via the router.use() above,
// which would send it back to the dashboard. Nothing else about the step
// (journey banner, nextHref) changes, since that middleware still runs
// first and sets everything else as normal.
router.get('/designer/migrate/single/upload', (req, res) => {
  res.locals.backHref = '/designer/migrate/single/metadata'
  res.render('designer/migrate/single/upload')
})

// Inserted between Upload a Word document and Checking your file — a
// "Step X of 2" sequence local to these two pages, kept separate from the
// journey banner and step count in app/data/prototypes.js, which is
// otherwise unchanged.
router.get('/designer/migrate/single/document-purpose', (req, res) => {
  res.locals.backHref = '/designer/migrate/single/upload'
  res.render('designer/migrate/single/document-purpose')
})

// Saves the document title and purpose to the session — nothing reads them
// back yet, but they are captured in case a later step needs them — then
// continues to Checking your file, same as before this page asked anything.
router.post('/designer/migrate/single/document-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/designer/migrate/single/uploading')
})

// "Create a new guide" on create-guidance.html — the same title/purpose
// fields as document-purpose.html above, but with no file to check
// afterwards, so this opens the markdown editor directly instead of
// Checking your file.
router.get('/designer/migrate/single/new-guide-purpose', (req, res) => {
  res.locals.backHref = '/create-guidance'
  res.render('designer/migrate/single/new-guide-purpose')
})

router.post('/designer/migrate/single/new-guide-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/designer/documents/edit')
})

// "Update existing guide" on create-guidance.html — not designed yet. See
// app/views/designer/update-existing-guide.html.
router.get('/designer/update-existing-guide', (req, res) => {
  res.locals.backHref = '/create-guidance'
  res.render('designer/update-existing-guide')
})

// ===========================================================================
// Version 1 snapshot — a frozen copy of every page reachable from the
// homepage, at app/views/versions/v1/. See app/views/index.html, the
// versions list this belongs to.
//
// Every route below is the /v1-prefixed mirror of a live route above: same
// logic, rendering from versions/v1/... instead of the live view, and
// redirecting to other /v1/... paths rather than live ones. Deliberately not
// sharing handler functions with the live routes — a frozen snapshot should
// not be able to change behaviour just because a live handler is edited
// later — though small path-free constants (VERDICTS, the AI search step
// counts, TOTAL_REVIEW_ISSUES) are reused as-is, since they are values, not
// logic that could drift.
//
// Not namespaced: session data (verdicts, the AI search query, activeJourney,
// document title/purpose) is shared between v1 and the live pages, since both
// read and write the same session keys. For a static prototype this is a
// reasonable simplification — the point of the snapshot is a frozen set of
// pages and links, not isolated persisted state — but it does mean, for
// example, recording a verdict on a finding in v1 also shows up if the same
// finding is opened live in the same browser session.
// ===========================================================================

// Same idea as the router.use() journey middleware above, but for a page
// mirrored under /v1: looks up backHref/nextHref against the *live* path a
// v1 page corresponds to (app/data/prototypes.js only knows live paths), then
// prefixes whatever it finds with /v1 — so the one step order in that file
// still drives both versions, without copying it.
function v1JourneyHrefs (req, livePath) {
  const location = prototypes.findStep(livePath, req.session.data.activeJourney)
  return {
    backHref: location && location.previous ? '/v1' + location.previous.path : undefined,
    nextHref: location && location.next ? '/v1' + location.next.path : undefined
  }
}

router.get('/v1/', (req, res) => {
  delete req.session.data.activeJourney
  res.render('versions/v1/start')
})

router.post('/v1/', (req, res) => {
  res.redirect(
    req.body.destination === 'find' ? '/v1/find-guidance' : '/v1/all-guidance-docs'
  )
})

router.get('/v1/find-guidance', (req, res) => {
  res.locals.backHref = '/v1/'
  res.render('versions/v1/find-guidance')
})

router.get('/v1/find-guidance/new', (req, res) => {
  res.locals.backHref = '/v1/find-guidance'
  res.render('versions/v1/find-guidance-new')
})

router.post('/v1/find-guidance/new', (req, res) => {
  res.redirect(
    req.body.searchMethod === 'ai' ? '/v1/find-guidance/ai-search' : '/v1/find-guidance/organic-search'
  )
})

router.get('/v1/find-guidance/delete/:id', (req, res) => {
  const search = guidedSearches.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/v1/find-guidance'
  res.render('versions/v1/delete-search-confirm', {
    searchName: search ? search.name : 'this search'
  })
})

router.get('/v1/find-guidance/document/:id', (req, res) => {
  const document =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/v1/find-guidance'
  res.render('versions/v1/saved-document-view', {
    id: req.params.id,
    documentName: document ? document.name : 'Document not found',
    status: document ? document.status : 'Up to date'
  })
})

router.get('/v1/find-guidance/organic-search', (req, res) => {
  res.locals.backHref = '/v1/find-guidance/new'
  res.render('versions/v1/organic-search', { results: searchResults })
})

router.get('/v1/find-guidance/ai-search', (req, res) => {
  res.locals.backHref = '/v1/find-guidance/new'
  res.render('versions/v1/ai-search')
})

router.post('/v1/find-guidance/ai-search-loading', (req, res) => {
  req.session.data.aiSearchQuery = (req.body.query || '').trim()
  res.redirect('/v1/find-guidance/ai-search-loading')
})

router.get('/v1/find-guidance/ai-search-loading', (req, res) => {
  res.render('versions/v1/ai-search-loading')
})

function renderV1AiSearchResults (req, res) {
  const search = guidedSearches.find((candidate) => candidate.id === req.params.id)
  const id = search ? search.id : 'new'
  const totalSteps = search ? search.totalSteps : DEFAULT_TOTAL_STEPS
  const startingStep = search ? search.resumeStep : DEFAULT_STEP

  const step = Math.min(
    Math.max(Number(req.params.step) || startingStep, 1),
    totalSteps
  )

  res.render('versions/v1/ai-search-results', {
    id,
    step,
    totalSteps,
    query: req.session.data.aiSearchQuery || DEFAULT_AI_SEARCH_QUERY,
    backHref:
      step > 1
        ? `/v1/find-guidance/ai-search-results/${id}/${step - 1}`
        : (search ? '/v1/find-guidance' : '/v1/find-guidance/ai-search'),
    backLinkHref: '/v1/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps ? `/v1/find-guidance/ai-search-results/${id}/${step + 1}` : '/v1/find-guidance'
  })
}

router.get('/v1/find-guidance/ai-search-results', renderV1AiSearchResults)
router.get('/v1/find-guidance/ai-search-results/:id', renderV1AiSearchResults)
router.get('/v1/find-guidance/ai-search-results/:id/:step', renderV1AiSearchResults)

function v1FindingOr404 (req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue) res.status(404).render('versions/v1/designer/documents/finding-not-found')
  return issue
}

router.get('/v1/designer/documents/findings/:id', (req, res) => {
  const issue = v1FindingOr404(req, res)
  if (!issue) return

  const { issues } = res.locals.document
  const position = issues.indexOf(issue)

  res.render('versions/v1/designer/documents/finding', {
    finding: issue,
    position: position + 1,
    total: issues.length,
    previousFinding: issues[position - 1],
    nextFinding: issues[position + 1]
  })
})

router.post('/v1/designer/documents/findings/:id', (req, res) => {
  const issue = v1FindingOr404(req, res)
  if (!issue) return

  if (!Object.prototype.hasOwnProperty.call(VERDICTS, req.body.verdict)) {
    return res.redirect(`/v1/designer/documents/findings/${issue.id}`)
  }

  req.session.data.verdicts = req.session.data.verdicts || {}
  req.session.data.verdicts[issue.id] = {
    verdict: req.body.verdict,
    comment: (req.body.comment || '').trim()
  }

  const next = res.locals.document.issues.find(
    (candidate) => candidate.id !== issue.id && !candidate.verdict
  )

  res.redirect(
    next
      ? `/v1/designer/documents/findings/${next.id}`
      : '/v1/designer/documents/review-complete'
  )
})

router.get('/v1/designer/documents/findings', (req, res) => {
  const next = res.locals.document.outstanding[0]
  res.redirect(
    next
      ? `/v1/designer/documents/findings/${next.id}`
      : '/v1/designer/documents/review-complete'
  )
})

router.get('/v1/designer/documents/review-reset', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/v1/designer/documents/issues')
})

router.get('/v1/all-guidance-docs', (req, res) => {
  res.locals.backHref = '/v1/'
  res.render('versions/v1/all-guidance-docs')
})

router.get('/v1/create-guidance', (req, res) => {
  res.locals.backHref = '/v1/all-guidance-docs'
  res.render('versions/v1/create-guidance')
})

router.post('/v1/create-guidance', (req, res) => {
  if (req.body.createGuidance === 'create-new') {
    return res.redirect('/v1/designer/migrate/single/new-guide-purpose')
  }

  if (req.body.createGuidance === 'update-existing') {
    return res.redirect('/v1/designer/update-existing-guide')
  }

  res.redirect('/v1' + res.locals.migrateHref)
})

router.get('/v1/guidance-document/:id', (req, res) => {
  res.locals.backHref = '/v1/all-guidance-docs'
  res.render('versions/v1/guidance-document')
})

function renderV1ChangeReview (req, res) {
  const id = req.params.id
  const issueNumber = Math.min(
    Math.max(Number(req.params.issueNumber) || 1, 1),
    TOTAL_REVIEW_ISSUES
  )

  res.locals.backHref = `/v1/guidance-document/${id}`

  res.render('versions/v1/change-review', {
    issueNumber,
    totalIssues: TOTAL_REVIEW_ISSUES,
    previousIssueHref:
      issueNumber > 1 ? `/v1/guidance-document/${id}/review/${issueNumber - 1}` : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES ? `/v1/guidance-document/${id}/review/${issueNumber + 1}` : null
  })
}

router.get('/v1/guidance-document/:id/review', renderV1ChangeReview)
router.get('/v1/guidance-document/:id/review/:issueNumber', renderV1ChangeReview)

router.get('/v1/designer/migrate/single/upload', (req, res) => {
  res.locals.backHref = '/v1/all-guidance-docs'
  res.render('versions/v1/designer/migrate/single/upload')
})

router.get('/v1/designer/migrate/single/document-purpose', (req, res) => {
  res.locals.backHref = '/v1/designer/migrate/single/upload'
  res.render('versions/v1/designer/migrate/single/document-purpose')
})

router.post('/v1/designer/migrate/single/document-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/v1/designer/migrate/single/uploading')
})

router.get('/v1/designer/migrate/single/new-guide-purpose', (req, res) => {
  res.locals.backHref = '/v1/create-guidance'
  res.render('versions/v1/designer/migrate/single/new-guide-purpose')
})

router.post('/v1/designer/migrate/single/new-guide-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/v1/designer/documents/edit')
})

router.get('/v1/designer/update-existing-guide', (req, res) => {
  res.locals.backHref = '/v1/create-guidance'
  res.render('versions/v1/designer/update-existing-guide')
})

router.get('/v1/designer/migrate/single/uploading', (req, res) => {
  Object.assign(res.locals, v1JourneyHrefs(req, '/designer/migrate/single/uploading'))
  res.render('versions/v1/designer/migrate/single/uploading')
})

router.get('/v1/designer/migrate/single/check', (req, res) => {
  Object.assign(res.locals, v1JourneyHrefs(req, '/designer/migrate/single/check'))
  res.render('versions/v1/designer/migrate/single/check')
})

router.get('/v1/designer/migrate/single/confirmation', (req, res) => {
  Object.assign(res.locals, v1JourneyHrefs(req, '/designer/migrate/single/confirmation'))
  res.render('versions/v1/designer/migrate/single/confirmation')
})

router.get('/v1/designer/migrate/single/rejected', (req, res) => {
  res.render('versions/v1/designer/migrate/single/rejected')
})

router.get('/v1/designer/documents', (req, res) => {
  res.locals.migrateHref = '/v1' + res.locals.migrateHref
  res.render('versions/v1/designer/documents')
})

// document.issues[].href is computed once in the router.use() middleware
// above with live paths baked in (used by the task list on issues.html), so
// it needs a v1-prefixed copy here rather than being read from res.locals
// as-is — passed as a render local, which take precedence over res.locals of
// the same name, rather than mutating the shared object other routes read.
// document.split.important/suggestions are qualityChecks.split()'s filtered
// results, which reference the same issue objects rather than copies — so
// they need remapping to the v1-prefixed issues too, or the task list on
// issues.html (which reads split, not issues, for its rows) still links live.
router.get('/v1/designer/documents/issues', (req, res) => {
  const v1Issues = res.locals.document.issues.map((issue) => ({
    ...issue,
    href: '/v1' + issue.href
  }))
  const byId = new Map(v1Issues.map((issue) => [issue.id, issue]))
  const v1Split = {
    important: res.locals.document.split.important.map((issue) => byId.get(issue.id)),
    suggestions: res.locals.document.split.suggestions.map((issue) => byId.get(issue.id))
  }

  res.render('versions/v1/designer/documents/issues', {
    document: { ...res.locals.document, issues: v1Issues, split: v1Split },
    editorHref: '/v1/designer/documents/edit',
    stepThroughHref: '/v1/designer/documents/findings',
    fixHref: res.locals.fixHref ? '/v1' + res.locals.fixHref : res.locals.fixHref
  })
})

router.get('/v1/designer/documents/edit', (req, res) => {
  res.render('versions/v1/designer/documents/edit')
})

router.get('/v1/designer/documents/preview', (req, res) => {
  res.render('versions/v1/designer/documents/preview')
})

router.get('/v1/designer/documents/review-complete', (req, res) => {
  res.render('versions/v1/designer/documents/review-complete')
})

// ===========================================================================
// Version 3 — a redesign of the whole entry, trying a different shape from
// v2's find/manage split: an unauthenticated page explaining the service at
// /v3/, then one full-width signed-in landing page at /v3/search that folds
// searching, filters and recent work into a single screen. Views live in
// app/views/versions/v3/ on layouts/v3.html (full width). See
// app/views/index.html, the versions list this belongs to.
// ===========================================================================

// The top nav v3's signed-in pages share, rendered by
// partials/defra-header.njk the same way the global `navigation` const would
// be: Home is the landing page at /v3/search, where all guidance is
// searched from. The unauthenticated front door at /v3/ is left out — with
// res.locals.navigation still empty there, the header shows the plain brand
// border instead, since none of these destinations makes sense before
// signing in.
// Sign out is as fake as sign in — it just returns to the unauthenticated
// front door. `right: true` pushes it to the far end of the bar (see
// partials/defra-header.njk).
const V3_NAVIGATION = [
  { text: 'Home', href: '/v3/search' },
  { text: 'My drafts', href: '/v3/drafts' },
  { text: 'My approvals', href: '/v3/approvals' },
  { text: 'Sign out', href: '/v3/', right: true }
]

// Mounted at /v3, so req.path here has the /v3 prefix already stripped —
// '/' is the front door, '/search' the landing page, and so on.
router.use('/v3', (req, res, next) => {
  if (req.path !== '/') {
    res.locals.navigation = V3_NAVIGATION.map((item) => ({
      ...item,
      current: item.href === '/v3' + req.path
    }))
  }
  next()
})

// What the service is, for someone not signed in yet. Signing in is as fake
// as the rest of the prototype — the button in the hero goes straight to the
// signed-in landing page below.
router.get('/v3/', (req, res) => {
  res.render('versions/v3/start')
})

// The facets on /v3/search, with the labels their values read back as when
// shown as removable "Selected filters" tags — the filter pattern copied
// from DEFRA/rpa-guidance-prototype (src/server/routes/guidance/library.njk
// and its guide-library module). The filters still change nothing about the
// fixed results; only what is shown as selected.
const V3_FILTER_GROUPS = {
  scheme: {
    sfi: 'Sustainable Farming Incentive',
    'countryside-stewardship': 'Countryside Stewardship',
    'cross-compliance': 'Cross Compliance'
  },
  documentType: {
    'guidance-document': 'Guidance document',
    form: 'Form',
    policy: 'Policy'
  },
  dateUpdated: {
    'last-week': 'Last week',
    'last-month': 'Last month',
    'last-year': 'Last year'
  },
  status: {
    'up-to-date': 'Up to date',
    'partially-updated': 'Partially updated',
    'out-of-date': 'Out of date'
  }
}

// A query value can arrive as a string, an array, or the kit's "_unchecked"
// sentinel — keep only real values the group knows about.
function toV3Selections (value, allowed) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.filter((candidate) => allowed[candidate])
}

// The signed-in landing page: search bar, collapsible filters and recent
// work on one screen. Nothing is listed until a search is explicitly made —
// the Search button and Apply filters both submit the same GET form, so
// ?search appears in the URL either way, and its presence (not its content)
// is what switches the results on: the search itself is as unwired as v2's,
// so any query shows the same fixed list from app/data/search-results.js.
router.get('/v3/search', (req, res) => {
  const searched = req.query.search !== undefined

  // What each facet currently has ticked, from the URL — so the checkboxes
  // survive the round trip, and each selection can be shown as a removable
  // tag whose href is this same URL minus that one value.
  const selections = {}
  Object.keys(V3_FILTER_GROUPS).forEach((group) => {
    selections[group] = toV3Selections(req.query[group], V3_FILTER_GROUPS[group])
  })

  const buildHref = (without) => {
    const params = new URLSearchParams()
    if (searched) params.set('search', req.query.search)
    Object.entries(selections).forEach(([group, values]) => {
      values.forEach((value) => {
        if (without && without.group === group && without.value === value) return
        params.append(group, value)
      })
    })
    const queryString = params.toString()
    return '/v3/search' + (queryString ? '?' + queryString : '')
  }

  const selectedFilters = []
  Object.entries(selections).forEach(([group, values]) => {
    values.forEach((value) => {
      selectedFilters.push({
        label: V3_FILTER_GROUPS[group][value],
        href: buildHref({ group, value })
      })
    })
  })

  // Recent work cards: recently opened documents from
  // app/data/guided-searches.js, each dressed with the status of the
  // matching document in app/data/search-results.js so the card can carry a
  // status tag.
  const recentWork = guidedSearches.map((search) => {
    const document = searchResults.find(
      (candidate) => candidate.id === search.documentId
    )
    return {
      id: search.documentId,
      name: search.name,
      lastOpened: search.lastOpened,
      status: document ? document.status : 'Up to date'
    }
  })

  res.render('versions/v3/search', {
    searched,
    query: req.query.search || '',
    results: searched ? searchResults : [],
    recentWork,
    selections,
    selectedFilters,
    // Clearing the filters keeps the search itself.
    clearHref: searched
      ? '/v3/search?search=' + encodeURIComponent(req.query.search)
      : '/v3/search'
  })
})

// "Add new" beside Home's search bar. v3's copy of the chooser (see
// app/views/versions/v3/create-guidance.html). "Update existing guide" now
// has a v3 flow of its own below; the other two options continue into the
// same designer flows v2 uses.
router.get('/v3/create-guidance', (req, res) => {
  res.locals.backHref = '/v3/search'
  res.render('versions/v3/create-guidance')
})

router.post('/v3/create-guidance', (req, res) => {
  if (req.body.createGuidance === 'update-existing') {
    return res.redirect('/v3/update-guide')
  }

  if (req.body.createGuidance === 'create-new') {
    return res.redirect('/designer/migrate/single/new-guide-purpose')
  }

  res.redirect('/v3/upload-guide')
})

// -- Upload guidance ---------------------------------------------------------
//
// v3's own short version of the migrate journey: name the guide and pick the
// Word document, watch it upload and convert, then land straight in the v3
// editor — quality checks already in the side pane — rather than the old
// editor and issues pages the designer flow ends in.

router.get('/v3/upload-guide', (req, res) => {
  res.locals.backHref = '/v3/create-guidance'
  res.render('versions/v3/upload-guide')
})

router.post('/v3/upload-guide', (req, res) => {
  // The file itself goes nowhere in a static prototype; the title is kept so
  // the editor and My drafts can call the guide by name. The converted
  // markdown is the shared sample document, like every editor here.
  req.session.data.v3UploadedGuide = {
    name:
      (req.body.guideTitle || '').trim() ||
      'Check an application for the Sustainable Farming Incentive'
  }
  res.redirect('/v3/upload-guide/processing')
})

router.get('/v3/upload-guide/processing', (req, res) => {
  res.render('versions/v3/upload-processing', {
    uploadedName: (req.session.data.v3UploadedGuide || {}).name
  })
})

// -- Update an existing guide ----------------------------------------------
//
// The v3 flow: pick the guide (this page), edit it in the TipTap-enhanced
// editor at /v3/guide/:id/edit, save back to the document overview. The
// same editor is also reachable straight from a search: result → document
// overview (verifying it is the right guide) → Edit guide.

router.get('/v3/update-guide', (req, res) => {
  res.locals.backHref = '/v3/create-guidance'
  res.render('versions/v3/update-guide', { guides: searchResults })
})

// The version history shown beside the editor — the same fixed example
// versions for every guide, but restoring one really changes the content:
// "18 August" is the document as migrated (app/data/sample-document.js
// unchanged), and "28 July" is an earlier draft, cut off before the Land
// parcel checks section was added.
const V3_GUIDE_VERSIONS = [
  { id: 'current', current: true },
  { id: 'v2', date: '18 August 2026', author: 'Priya Devi' },
  { id: 'v1', date: '28 July 2026', author: 'Tom Youngson' }
]

function v3VersionMarkdown (versionId) {
  if (versionId === 'v1') {
    return sampleDocument.split('## Land parcel checks')[0].trimEnd() + '\n'
  }
  return sampleDocument
}

// The editor. Every guide edits the same placeholder markdown
// (app/data/sample-document.js) under its own name, like the editors
// elsewhere in this prototype — except an edit saved in this session sticks,
// so saving and reopening shows your changes rather than quietly reverting.
//
// ?from=overview marks the copy opened from a document overview, so Back and
// Cancel return to where the designer actually came from. ?restored carries
// the date of a just-restored version, for the banner.
router.get('/v3/guide/:id/edit', (req, res) => {
  // The guide's name can come from three places: the search results (the
  // update-existing flow), My drafts (:id is the same name slug
  // all-guidance-docs.html builds), or the session (a guide uploaded this
  // session lives at the fixed id "uploaded").
  const guide = searchResults.find((candidate) => candidate.id === req.params.id)
  const draft = library.documents.find(
    (document) => slugify(document.name) === req.params.id
  )
  const uploaded =
    req.params.id === 'uploaded' ? req.session.data.v3UploadedGuide : null

  const edits = req.session.data.v3GuideEdits || {}
  const fromOverview = req.query.from === 'overview'
  const cancelHref = fromOverview
    ? `/v3/document-overview/${req.params.id}`
    : req.query.from === 'drafts' || uploaded
      ? '/v3/drafts'
      : '/v3/update-guide'
  const markdown = edits[req.params.id] || sampleDocument

  res.locals.backHref = cancelHref
  res.render('versions/v3/guide-edit', {
    id: req.params.id,
    guideName:
      (guide && guide.name) ||
      (draft && draft.name) ||
      (uploaded && uploaded.name) ||
      'Guide not found',
    caption: uploaded ? 'New guide' : 'Update guide',
    // Set arriving from the upload journey, for the converted banner.
    converted: req.query.converted === '1',
    markdown,
    cancelHref,
    fromOverview,
    restored: req.query.restored,
    // The Quality checks pane beside the editor — run on the markdown being
    // served, so a restored or edited version is checked as it stands. Only
    // findings a designer can act on here make the list: the advisory
    // low/info ones are noise at this stage, and GI-002 quotes an image
    // path that never appears in the rendered text, so its anchor has
    // nowhere to land.
    findings: qualityChecks.findIssues(markdown).filter(
      (finding) =>
        ['critical', 'high', 'medium'].includes(finding.severity) &&
        finding.ruleId !== 'GI-002'
    ),
    comments: V3_GUIDE_COMMENTS,
    versions: V3_GUIDE_VERSIONS
  })
})

// Comments an approver or reviewer has left on the guide, shown beside the
// editor. Fixed examples; each quotes the passage it is about, so clicking
// a comment jumps there the same way a quality finding does.
const V3_GUIDE_COMMENTS = [
  {
    author: 'Priya Devi',
    role: 'Approver',
    date: '18 August 2026',
    text: 'Can we spell out what happens when the parcels do not match? The referral to the mapping team needs a timescale.',
    quote: 'Compare the land parcel numbers against the mapping service'
  },
  {
    author: 'Tom Youngson',
    role: 'Reviewer',
    date: '16 August 2026',
    text: 'The evidence checklist should link to the SFI evidence requirements page rather than describing it.',
    quote: 'The customer must supply evidence for each option they have applied for'
  },
  {
    author: 'Priya Devi',
    role: 'Approver',
    date: '15 August 2026',
    text: 'Good to see the warning kept. Suggest moving it above the steps so it is read before anyone starts.',
    quote: 'Warning: Do not approve a claim where evidence is missing.'
  }
]


// Restoring a version puts that version's markdown into the session — the
// same place an edit lands — and returns to the editor with a banner, so
// what happens next (keep it, tweak it, save it) is the designer's call.
router.post('/v3/guide/:id/restore', (req, res) => {
  const version = V3_GUIDE_VERSIONS.find(
    (candidate) => candidate.id === req.body.version && !candidate.current
  )
  if (!version) {
    return res.redirect(`/v3/guide/${req.params.id}/edit`)
  }

  req.session.data.v3GuideEdits = req.session.data.v3GuideEdits || {}
  req.session.data.v3GuideEdits[req.params.id] = v3VersionMarkdown(version.id)

  const params = new URLSearchParams({ restored: version.date })
  if (req.body.from === 'overview') params.set('from', 'overview')
  res.redirect(`/v3/guide/${req.params.id}/edit?` + params.toString())
})

// Saving keeps the markdown in the session (nothing in this prototype
// persists for real) and lands on the guide's overview with a success
// banner — or, for a guide with no overview (a draft, or one uploaded this
// session), on My drafts.
router.post('/v3/guide/:id/edit', (req, res) => {
  req.session.data.v3GuideEdits = req.session.data.v3GuideEdits || {}
  req.session.data.v3GuideEdits[req.params.id] = req.body.markdown || ''

  const guide = searchResults.find((candidate) => candidate.id === req.params.id)
  res.redirect(
    guide
      ? `/v3/document-overview/${req.params.id}?saved=1`
      : '/v3/drafts?saved=1'
  )
})

// "My drafts" on the v3 top nav — documents this designer is part way
// through, from app/data/documents.js, dressed with fixed last-edited dates
// (newest first, matching the file's order of Draft rows). See
// app/views/versions/v3/drafts.html.
const V3_DRAFT_DATES = ['24 August 2026', '21 August 2026', '18 August 2026', '11 August 2026']

router.get('/v3/drafts', (req, res) => {
  const drafts = library.documents
    .filter((document) => document.status === 'Draft')
    .map((document, index) => ({
      ...document,
      // The same name slug all-guidance-docs.html builds, so each row can
      // open v3's editor at /v3/guide/:id/edit.
      id: slugify(document.name),
      lastEdited: V3_DRAFT_DATES[index] || '11 August 2026'
    }))

  // A guide uploaded this session joins the top of the list — a converted
  // document becomes a draft.
  const uploaded = req.session.data.v3UploadedGuide
  if (uploaded) {
    drafts.unshift({
      id: 'uploaded',
      name: uploaded.name,
      pages: 34,
      issues: 14,
      lastEdited: 'Today'
    })
  }

  res.render('versions/v3/drafts', {
    drafts,
    // Set after saving in the v3 editor, for the success banner.
    saved: req.query.saved === '1'
  })
})

// "My approvals" — documents sent to this owner to approve and publish,
// also from app/data/documents.js, dressed with who sent each one and when.
// Review opens the live guidance document overview, whose :id is the same
// name slug all-guidance-docs.html builds (see slugify above). See
// app/views/versions/v3/approvals.html.
const V3_APPROVAL_DETAILS = [
  { sentBy: 'Priya Devi', sent: '22 August 2026' },
  { sentBy: 'Tom Youngson', sent: '19 August 2026' }
]

router.get('/v3/approvals', (req, res) => {
  const approvals = library.documents
    .filter((document) => document.status === 'Awaiting approval')
    .map((document, index) => ({
      ...document,
      ...(V3_APPROVAL_DETAILS[index] || V3_APPROVAL_DETAILS[0]),
      href: '/guidance-document/' + slugify(document.name)
    }))

  res.render('versions/v3/approvals', { approvals })
})

// v3's copy of the document overview — same lookup as the live
// /document-overview/:id above, rendered full width with its back link
// pointing into v3. See app/views/versions/v3/document-overview.html.
router.get('/v3/document-overview/:id', (req, res) => {
  const result = searchResults.find((candidate) => candidate.id === req.params.id)
  const overview = documentOverviews[req.params.id] || {}

  res.locals.backHref = '/v3/search'
  res.render('versions/v3/document-overview', {
    id: req.params.id,
    documentName: result ? result.name : 'Document not found',
    description: result ? result.description : '',
    status: result ? result.status : 'Up to date',
    scheme: overview.scheme || '',
    type: overview.type || '',
    lastUpdated: overview.lastUpdated || '',
    // Set after saving in the editor at /v3/guide/:id/edit, for the success
    // banner.
    saved: req.query.saved === '1'
  })
})

// Add your routes here
