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
const { guidanceDocuments } = require('./data/guidance-documents')
const sampleDocument = require('./data/sample-document')
const v4SampleDocument = require('./data/v4-sample-document')
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
//
// Both tabs' rows are built here from app/data/guidance-documents.js, looked
// up by title against a fixed list of (title, lastOpened) pairs, rather than
// from res.locals.guidedSearches/favouritedGuidance (still set above, for
// other pages) — those two files predate guidance-documents.js and do not
// have the version field this page's rows now need. A title with no match is
// skipped with a console warning rather than breaking the page.
router.get('/find-guidance', (req, res) => {
  // No backHref — find-guidance.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const findGuidanceDocumentRows = (entries) =>
    entries.reduce((rows, entry) => {
      const document = guidanceDocuments.find((candidate) => candidate.title === entry.title)
      if (!document) {
        console.warn(`find-guidance: no guidance-documents entry found for title "${entry.title}"`)
        return rows
      }
      rows.push({
        id: document.id,
        title: document.title,
        version: document.version,
        lastOpened: entry.lastOpened
      })
      return rows
    }, [])

  const recentlyOpenedDocuments = findGuidanceDocumentRows([
    { title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026', lastOpened: '17 August 2026' },
    { title: 'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026', lastOpened: '15 August 2026' },
    { title: 'CS MA Claim - Agreement Level Options not Verified 2026', lastOpened: '10 August 2026' },
    { title: 'CS MA Claim - Claim Refresh Signoff Check 2026', lastOpened: '2 August 2026' }
  ])

  const savedGuidanceDocuments = findGuidanceDocumentRows([
    { title: 'Countryside Stewardship: capital grants', lastOpened: '28 July 2026' },
    { title: 'Basic Payment Scheme: closing rules', lastOpened: '19 July 2026' },
    { title: 'Sustainable Farming Incentive: soil health actions', lastOpened: '5 July 2026' }
  ])

  res.render('find-guidance', { recentlyOpenedDocuments, savedGuidanceDocuments })
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

// Confirms removing a row from either tab on find-guidance.html — reached
// from that page's own "Remove" links, which carry ?id= (a
// guidance-documents.js id) and ?tab= (recently-opened or saved-guidance) so
// this page can say which document, from which list. A static prototype has
// nothing real to remove, so "Yes, remove" just returns to find-guidance.html
// at the correct tab's own #anchor — see app/views/delete-search-confirm.html.
// tab's anchor is "favourited-guidance" for saved-guidance specifically,
// matching that tab's own id in the govukTabs call on find-guidance.html
// (its label reads "Saved guidance", but the id/anchor was never renamed to
// match). A direct visit with no id/tab, or one that matches neither, falls
// back to a generic message rather than erroring.
const REMOVE_CONFIRM_TABS = {
  'recently-opened': { listName: 'Recently opened', anchor: 'recently-opened' },
  'saved-guidance': { listName: 'Saved guidance', anchor: 'favourited-guidance' }
}

router.get('/find-guidance/remove-confirm', (req, res) => {
  const document = guidanceDocuments.find((candidate) => candidate.id === req.query.id)
  const tab = REMOVE_CONFIRM_TABS[req.query.tab]

  res.locals.backHref = '/find-guidance'
  res.render('delete-search-confirm', {
    documentTitle: document ? document.title : null,
    listName: tab ? tab.listName : null,
    returnHref: tab ? '/find-guidance#' + tab.anchor : '/find-guidance'
  })
})

// A document's read-only view — opened from the "Saved documents" tab on
// find-guidance.html, or from a result on organic-search.html (by way of
// document-overview.html) for a document not saved yet. guidanceDocuments is
// tried first, since that is what every organic-search.html result now links
// through as, then savedDocuments/searchResults for the older ids still used
// by find-guidance.html's "Recently opened"/"Favourited guidance" tabs, then
// guidanceDocuments[0] if the id matches neither — so this route never 404s
// or shows "Document not found", whichever flow reached it. The section
// content itself is fixed placeholder text local to
// app/views/saved-document-view.html, one set per (legacy) document id — an
// id from guidanceDocuments that is not also one of those keys just shows
// the same placeholder content as countryside-stewardship-capital-grants,
// which is expected: only the heading and Version tag need to be correct.
//
// A guidanceDocuments entry can carry its own "steps" array (currently only
// cs-ma-revenue-options-claim-rule-signoff-2026 does) — when it does, that
// replaces the generic placeholder content entirely, and which step is
// showing is server-side state driven by ?step=, not client-side JS like the
// generic flow's Back/Next. req.query.step is clamped to a valid step
// number, defaulting to 1, so an out-of-range or missing/non-numeric step
// never breaks the page.
router.get('/find-guidance/document/:id', (req, res) => {
  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === req.params.id)
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/find-guidance'

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : legacyDocument ? legacyDocument.name : guidanceDocuments[0].title
  // Legacy savedDocuments/searchResults entries have a status, not a
  // version — every id that matters here is also in guidanceDocuments
  // though (see the comment above), so this only ever falls back to
  // guidanceDocuments[0].version for a genuinely unmatched id.
  const version = guidanceDocument ? guidanceDocument.version : guidanceDocuments[0].version

  if (guidanceDocument && guidanceDocument.steps) {
    const totalSteps = guidanceDocument.steps.length
    const requestedStep = parseInt(req.query.step, 10)
    const stepNumber = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

    res.render('saved-document-view', {
      id: req.params.id,
      documentName,
      version,
      customSteps: guidanceDocument.steps,
      currentStep: guidanceDocument.steps[stepNumber - 1],
      stepNumber,
      totalSteps
    })
    return
  }

  res.render('saved-document-view', {
    id: req.params.id,
    documentName,
    version
  })
})

// Search by document name, date or type. The search bar and filters are not
// wired up to anything real — see app/views/organic-search.html — so this
// always shows the same fixed set of example results: the guidanceDocuments
// entries flagged showOnOrganicSearch, not every entry in that file — it
// also holds a few documents (see find-guidance.html's "Saved guidance" tab)
// that were never organic-search results to begin with.
router.get('/find-guidance/organic-search', (req, res) => {
  // No backHref — organic-search.html shows breadcrumbs instead of a Back
  // link now (see the template).
  res.render('organic-search', { results: guidanceDocuments.filter((document) => document.showOnOrganicSearch) })
})

// A stop between a result on organic-search.html and the document itself
// (saved-document-view.html, at /find-guidance/document/:id) — see
// app/views/document-overview.html. Falls back to the first entry in
// app/data/guidance-documents.js if the id does not match, so this page
// never breaks — including when visited with no id at all.
//
// defaultVersionKey tells the template which of document.versions.version1/
// version2 to show initially, matching document.version. versionsJson is
// that same versions object serialised once here, rather than with a
// template filter, so the page's own inline script can read both versions'
// lastUpdated/published/versionNotes and swap between them as the Version
// dropdown changes — no server round trip needed for a prototype.
router.get('/document-overview/:id', (req, res) => {
  const document =
    guidanceDocuments.find((candidate) => candidate.id === req.params.id) ||
    guidanceDocuments[0]

  // No backHref — document-overview.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('document-overview', {
    document,
    defaultVersionKey: document.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(document.versions)
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
  // No backHref — all-guidance-docs.html shows breadcrumbs instead of a
  // Back link now (see the template).
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
  // No backHref — guidance-document.html shows breadcrumbs instead of a
  // Back link now (see the template).
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
// searching, filters and saved guides into a single screen. Views live in
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

  // My saved guides: documents saved from a search, from
  // app/data/saved-documents.js — the same ids the document overviews and
  // the editor resolve.
  const removed = req.session.data.v3RemovedSavedGuides || []
  const savedGuides = savedDocuments
    .filter((document) => !removed.includes(document.id))
    .map((document) => ({
      id: document.id,
      name: document.name,
      saved: document.date
    }))

  res.render('versions/v3/search', {
    searched,
    query: req.query.search || '',
    results: searched ? searchResults : [],
    savedGuides,
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
  if (req.body.createGuidance === 'create-new') {
    return res.redirect('/v3/new-guide')
  }

  res.redirect('/v3/upload-guide')
})

// -- Create a new guide ------------------------------------------------------
//
// v3's version of the create-new flow, matching the shape of the upload
// journey below: the guide's details, a check page, a success page, then
// the v3 editor — starting from a skeleton document rather than a
// converted one.

// The skeleton a new guide starts from: the shape the authoring
// requirements ask for, with prompts where the writing goes.
function v3StarterMarkdown (title) {
  return [
    '# ' + title,
    '',
    'As a [who this guide is for]',
    'You need to [what they need to do]',
    'So that [why it matters]',
    '',
    '## Before you start',
    '',
    '[What the reader needs access to, or to have to hand.]',
    '',
    '## Steps',
    '',
    '1. [Open each step with an action verb.]',
    '',
    '## Notes',
    ''
  ].join('\n')
}

router.get('/v3/new-guide', (req, res) => {
  const created = req.session.data.v3NewGuide || {}

  res.locals.backHref = '/v3/create-guidance'
  res.render('versions/v3/new-guide', {
    guideTitle: created.name || '',
    owner: created.owner || 'Priya Devi',
    guidanceType: created.type || 'process-guide'
  })
})

// Creating writes the skeleton into the session as the guide's markdown and
// goes straight into the editor — no check or success page between the
// details and the writing.
router.post('/v3/new-guide', (req, res) => {
  const created = {
    name: (req.body.guideTitle || '').trim() || 'Untitled guide',
    owner: (req.body.owner || '').trim() || 'Priya Devi',
    type: V3_GUIDANCE_TYPES[req.body.guidanceType]
      ? req.body.guidanceType
      : 'process-guide'
  }

  req.session.data.v3NewGuide = created
  req.session.data.v3GuideEdits = req.session.data.v3GuideEdits || {}
  req.session.data.v3GuideEdits.new = v3StarterMarkdown(created.name)
  res.redirect('/v3/guide/new/edit')
})

// -- Upload guidance ---------------------------------------------------------
//
// v3's version of the migrate journey: pick the Word document, watch it
// upload and scan, confirm the guide's details (title, owner, type — read
// out of the document for the designer to correct), check everything before
// converting, then land in the v3 editor — quality checks already in the
// side pane — rather than the old editor and issues pages the designer flow
// ends in.

const V3_GUIDANCE_TYPES = {
  'process-guide': 'Process guide',
  'policy-guidance': 'Policy guidance',
  'reference-document': 'Reference document'
}

// The title as if read out of the uploaded document — the converted markdown
// is the shared sample document, whose H1 this is.
const V3_UPLOAD_DEFAULT_TITLE =
  'Check an application for the Sustainable Farming Incentive'

// Only findings a designer can act on in the v3 editor make its pane (and
// the count on the converted success page): the advisory low/info ones are
// noise at this stage, and GI-002 quotes an image path that never appears
// in the rendered text, so its anchor has nowhere to land.
function v3EditorFindings (markdown) {
  return qualityChecks.findIssues(markdown).filter(
    (finding) =>
      ['critical', 'high', 'medium'].includes(finding.severity) &&
      finding.ruleId !== 'GI-002'
  )
}

router.get('/v3/upload-guide', (req, res) => {
  res.locals.backHref = '/v3/create-guidance'
  res.render('versions/v3/upload-guide')
})

router.post('/v3/upload-guide', (req, res) => {
  // The file itself goes nowhere in a static prototype — straight on to the
  // upload-and-scan wait.
  res.redirect('/v3/upload-guide/processing')
})

router.get('/v3/upload-guide/processing', (req, res) => {
  res.render('versions/v3/upload-processing')
})

// Add or confirm the guide's details. Title and type arrive prefilled as if
// extracted from the document; the owner is who approves and publishes it.
router.get('/v3/upload-guide/metadata', (req, res) => {
  const uploaded = req.session.data.v3UploadedGuide || {}

  res.locals.backHref = '/v3/upload-guide'
  res.render('versions/v3/upload-metadata', {
    guideTitle: uploaded.name || V3_UPLOAD_DEFAULT_TITLE,
    owner: uploaded.owner || 'Priya Devi',
    guidanceType: uploaded.type || 'process-guide'
  })
})

router.post('/v3/upload-guide/metadata', (req, res) => {
  req.session.data.v3UploadedGuide = {
    name: (req.body.guideTitle || '').trim() || V3_UPLOAD_DEFAULT_TITLE,
    owner: (req.body.owner || '').trim() || 'Priya Devi',
    type: V3_GUIDANCE_TYPES[req.body.guidanceType]
      ? req.body.guidanceType
      : 'process-guide'
  }
  res.redirect('/v3/upload-guide/check')
})

// The check page before converting — everything on one summary list, with
// Change links back into the journey.
router.get('/v3/upload-guide/check', (req, res) => {
  const uploaded = req.session.data.v3UploadedGuide
  if (!uploaded) return res.redirect('/v3/upload-guide')

  res.locals.backHref = '/v3/upload-guide/metadata'
  res.render('versions/v3/upload-check', {
    uploaded,
    typeLabel: V3_GUIDANCE_TYPES[uploaded.type] || 'Process guide'
  })
})

router.post('/v3/upload-guide/check', (req, res) => {
  res.redirect('/v3/upload-guide/converted')
})

// The success page after converting — the confirmation-panel pattern the
// old flow's "Document migrated" page used, rather than a banner on the
// editor. Sets what happens next, then hands over to editing.
router.get('/v3/upload-guide/converted', (req, res) => {
  const uploaded = req.session.data.v3UploadedGuide
  if (!uploaded) return res.redirect('/v3/upload-guide')

  const edits = req.session.data.v3GuideEdits || {}
  res.render('versions/v3/upload-converted', {
    guideName: uploaded.name,
    findingsCount: v3EditorFindings(edits.uploaded || sampleDocument).length
  })
})

// -- Update an existing guide ----------------------------------------------
//
// Updating an existing guide starts from searching, not from Add new:
// result → document overview (verifying it is the right guide) → Edit
// guide, into the TipTap-enhanced editor at /v3/guide/:id/edit.

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
// ?restored carries the date of a just-restored version, for the banner.
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
  const created =
    req.params.id === 'new' ? req.session.data.v3NewGuide : null

  const edits = req.session.data.v3GuideEdits || {}
  // A guide from the search results belongs to its document overview (the
  // page that verified it); everything else — drafts, uploads, new guides —
  // belongs to My drafts.
  const cancelHref = guide
    ? `/v3/document-overview/${req.params.id}`
    : '/v3/drafts'
  const markdown = edits[req.params.id] || sampleDocument

  res.locals.backHref = cancelHref
  res.render('versions/v3/guide-edit', {
    id: req.params.id,
    guideName:
      (guide && guide.name) ||
      (draft && draft.name) ||
      (uploaded && uploaded.name) ||
      (created && created.name) ||
      'Guide not found',
    caption: uploaded || created ? 'New guide' : 'Update guide',
    markdown,
    cancelHref,
    restored: req.query.restored,
    // The Quality checks pane beside the editor — run on the markdown being
    // served, so a restored or edited version is checked as it stands.
    findings: v3EditorFindings(markdown),
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

// "My drafts" on the v3 top nav — the designer's guides at every stage of
// the workflow (Draft, Pending, Approved, Published, Removed). Fixed
// example rows built on names from app/data/documents.js, so each row's
// name slug opens v3's editor at /v3/guide/:id/edit; status, scheme and
// comment counts are this page's own. See app/views/versions/v3/drafts.html.
const V3_DRAFT_ROWS = [
  { name: 'Applying for the Sustainable Farming Incentive', status: 'Draft', scheme: 'Sustainable Farming Incentive', issues: 31, comments: 2, lastEdited: '24 August 2026' },
  { name: 'How inspections work', status: 'Pending', scheme: 'Cross Compliance', issues: 12, comments: 3, lastEdited: '21 August 2026' },
  { name: 'Cross compliance rules', status: 'Approved', scheme: 'Cross Compliance', issues: 22, comments: 1, lastEdited: '18 August 2026' },
  { name: 'Woodland creation: eligibility', status: 'Published', scheme: 'Countryside Stewardship', issues: 14, comments: 0, lastEdited: '11 August 2026' },
  { name: 'Payment deadlines and what to expect', status: 'Removed', scheme: 'Basic Payment Scheme', issues: 8, comments: 4, lastEdited: '2 August 2026' }
]

router.get('/v3/drafts', (req, res) => {
  const drafts = V3_DRAFT_ROWS.map((row) => ({
    ...row,
    id: slugify(row.name)
  }))

  // Guides made this session join the top of the list — a converted or
  // newly created document becomes a draft. Their issue counts are computed
  // from their actual markdown, so the list agrees with the editor's pane;
  // the uploaded guide's comment count is the same fixed set the editor's
  // Comments panel shows.
  const edits = req.session.data.v3GuideEdits || {}
  const created = req.session.data.v3NewGuide
  if (created) {
    drafts.unshift({
      id: 'new',
      name: created.name,
      status: 'Draft',
      scheme: '-',
      issues: v3EditorFindings(edits.new || sampleDocument).length,
      comments: 0,
      lastEdited: 'Today'
    })
  }

  const uploaded = req.session.data.v3UploadedGuide
  if (uploaded) {
    drafts.unshift({
      id: 'uploaded',
      name: uploaded.name,
      status: 'Draft',
      scheme: 'Sustainable Farming Incentive',
      issues: v3EditorFindings(edits.uploaded || sampleDocument).length,
      comments: V3_GUIDE_COMMENTS.length,
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

// "Remove" on a My saved guides row. Nothing real to delete in a static
// prototype, but the removal sticks for the session so the table responds.
router.get('/v3/saved-guides/remove/:id', (req, res) => {
  req.session.data.v3RemovedSavedGuides =
    req.session.data.v3RemovedSavedGuides || []
  if (!req.session.data.v3RemovedSavedGuides.includes(req.params.id)) {
    req.session.data.v3RemovedSavedGuides.push(req.params.id)
  }
  res.redirect('/v3/search#saved-guides')
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

// Standalone design experiment — not linked from anywhere else yet, and not
// part of the v1 snapshot or any live journey. Hardcoded sample data lives
// in the view itself, so no session/form logic is needed here.
router.get('/v2/editor-experiment', (req, res) => {
  res.render('v2/editor-experiment')
})

// ===========================================================================
// Version 4 — a simple guidance upload journey, based on v3's, with the
// richer metadata captured in v2's upload journey (who it is for, what it
// aims to achieve, what users need to do, whether they need system access)
// added at the details step — after the upload scan and before the
// conversion, the position v3 established.
//
// No quality checks run after converting for now, so the success page
// confirms the conversion and offers to view the converted guidance rather
// than sending the designer into an editor to fix findings. Views live in
// app/views/versions/v4/. Guidance types and the default title are reused
// from the v3 constants above.
// ===========================================================================

router.get('/v4/upload-guide', (req, res) => {
  res.render('versions/v4/upload-guide')
})

router.post('/v4/upload-guide', (req, res) => {
  // A new upload is a new guide, so clear any details left in the session
  // from a previous run — the details step then starts fresh (title from
  // the document, owner blank for the author to enter). The file itself goes
  // nowhere in a static prototype.
  delete req.session.data.v4UploadedGuide
  res.redirect('/v4/upload-guide/processing')
})

router.get('/v4/upload-guide/processing', (req, res) => {
  res.render('versions/v4/upload-processing')
})

// The metadata options, with the labels their values read back as on the
// check page. Scheme is one-of (a select); audience and systems are many-of
// (checkboxes).
const V4_SCHEMES = {
  sfi: 'Sustainable Farming Incentive',
  'countryside-stewardship': 'Countryside Stewardship',
  'cross-compliance': 'Cross Compliance',
  'basic-payment-scheme': 'Basic Payment Scheme'
}
const V4_AUDIENCE = { processor: 'Processor', 'team-leader': 'Team leader' }
const V4_SYSTEMS = { agri: 'Siti Agri', crm: 'CRM' }

// The sample upload is the mock claim-processing guide (see
// app/data/v4-sample-document.js). Its title prefills the details step, and
// its version and last modified date are read from the document, so they are
// the same every time and cannot be changed.
const V4_UPLOAD_DEFAULT_TITLE = 'Processing farmer claims using RPA processors and legacy systems'
const V4_UPLOAD_VERSION = '1.0'
const V4_UPLOAD_LAST_MODIFIED = '29 June 2026'

// Keep only the checkbox values the field knows about — a value can arrive
// as a string, an array, or the kit's "_unchecked" sentinel.
function v4Selected (value, allowed) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.filter((candidate) => allowed[candidate])
}

// The details are captured across three steps. Each step merges its own
// fields into the one session object, so a Change link back to any step
// leaves the others untouched. The object seeds with the facts read from the
// document (title, version, date), the fixed type, and everything else empty.
function v4Details (req) {
  return req.session.data.v4UploadedGuide || {
    name: V4_UPLOAD_DEFAULT_TITLE,
    version: V4_UPLOAD_VERSION,
    lastModified: V4_UPLOAD_LAST_MODIFIED,
    scheme: '',
    owner: '',
    type: 'Process guide',
    audience: [],
    goal: '',
    requirements: '',
    systems: []
  }
}

// Every question across the three steps is required. Each POST validates,
// re-rendering its own page with an error summary and inline messages when
// something is missing, and only saves and moves on when the step is valid.
const V4_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Step 1 of 3 — the facts read from the document (title editable; version and
// date read-only) plus the scheme this guidance relates to.
router.get('/v4/upload-guide/metadata', (req, res) => {
  res.locals.backHref = '/v4/upload-guide'
  res.render('versions/v4/upload-metadata', { details: v4Details(req), errors: {}, errorList: [] })
})

router.post('/v4/upload-guide/metadata', (req, res) => {
  const title = (req.body.guideTitle || '').trim()
  // 'none' is the explicit "Not scheme-specific" radio — a real answer; only
  // a missing selection is an error. Anything unknown falls back to ''.
  const scheme = (V4_SCHEMES[req.body.scheme] || req.body.scheme === 'none') ? req.body.scheme : ''

  const errors = {}
  if (!title) errors.guideTitle = { text: 'Enter a guidance title', href: '#guide-title' }
  if (!req.body.scheme) errors.scheme = { text: 'Select the scheme this guidance relates to', href: '#scheme' }

  if (Object.keys(errors).length) {
    res.locals.backHref = '/v4/upload-guide'
    return res.render('versions/v4/upload-metadata', {
      details: Object.assign({}, v4Details(req), { name: title, scheme: req.body.scheme || '' }),
      errors,
      errorList: Object.values(errors)
    })
  }

  const details = v4Details(req)
  details.name = title
  // Read from the document; not taken from the form.
  details.version = V4_UPLOAD_VERSION
  details.lastModified = V4_UPLOAD_LAST_MODIFIED
  details.type = 'Process guide'
  details.scheme = scheme
  req.session.data.v4UploadedGuide = details
  res.redirect('/v4/upload-guide/metadata/purpose')
})

// Step 2 of 3 — who owns the guidance and what it aims to achieve.
router.get('/v4/upload-guide/metadata/purpose', (req, res) => {
  if (!req.session.data.v4UploadedGuide) return res.redirect('/v4/upload-guide/metadata')
  res.locals.backHref = '/v4/upload-guide/metadata'
  res.render('versions/v4/upload-metadata-purpose', { details: req.session.data.v4UploadedGuide, errors: {}, errorList: [] })
})

router.post('/v4/upload-guide/metadata/purpose', (req, res) => {
  const owner = (req.body.owner || '').trim()
  const goal = (req.body.goal || '').trim()

  const errors = {}
  if (!owner) errors.owner = { text: 'Enter the owner’s email address', href: '#owner' }
  else if (!V4_EMAIL_RE.test(owner)) errors.owner = { text: 'Enter an email address in the correct format, like name@example.com', href: '#owner' }
  if (!goal) errors.goal = { text: 'Enter what this guidance aims to achieve', href: '#goal' }

  if (Object.keys(errors).length) {
    res.locals.backHref = '/v4/upload-guide/metadata'
    return res.render('versions/v4/upload-metadata-purpose', {
      details: Object.assign({}, v4Details(req), { owner, goal }),
      errors,
      errorList: Object.values(errors)
    })
  }

  const details = v4Details(req)
  details.owner = owner
  details.goal = goal
  req.session.data.v4UploadedGuide = details
  res.redirect('/v4/upload-guide/metadata/usage')
})

// Step 3 of 3 — who it is for, what users need to do, and system access.
router.get('/v4/upload-guide/metadata/usage', (req, res) => {
  if (!req.session.data.v4UploadedGuide) return res.redirect('/v4/upload-guide/metadata')
  res.locals.backHref = '/v4/upload-guide/metadata/purpose'
  res.render('versions/v4/upload-metadata-usage', { details: req.session.data.v4UploadedGuide, errors: {}, errorList: [] })
})

router.post('/v4/upload-guide/metadata/usage', (req, res) => {
  const audience = v4Selected(req.body.audience, V4_AUDIENCE)
  const requirements = (req.body.requirements || '').trim()
  const systems = v4Selected(req.body.systems, V4_SYSTEMS)

  const errors = {}
  if (!audience.length) errors.audience = { text: 'Select who this guidance is for', href: '#audience' }
  if (!requirements) errors.requirements = { text: 'Enter what users need to perform or understand', href: '#requirements' }
  if (!systems.length) errors.systems = { text: 'Select the systems this guidance uses', href: '#systems' }

  if (Object.keys(errors).length) {
    res.locals.backHref = '/v4/upload-guide/metadata/purpose'
    return res.render('versions/v4/upload-metadata-usage', {
      details: Object.assign({}, v4Details(req), { audience, requirements, systems }),
      errors,
      errorList: Object.values(errors)
    })
  }

  const details = v4Details(req)
  details.audience = audience
  details.requirements = requirements
  details.systems = systems
  req.session.data.v4UploadedGuide = details
  res.redirect('/v4/upload-guide/check')
})

// The check page before converting — everything on one summary list, with
// Change links back to the details step (except the auto-filled fields).
router.get('/v4/upload-guide/check', (req, res) => {
  const details = req.session.data.v4UploadedGuide
  if (!details) return res.redirect('/v4/upload-guide')

  const listOr = (values, labels, fallback) => {
    const named = (values || []).map((value) => labels[value]).filter(Boolean)
    return named.length ? named.join(', ') : fallback
  }

  res.locals.backHref = '/v4/upload-guide/metadata/usage'
  res.render('versions/v4/upload-check', {
    details,
    typeLabel: details.type,
    schemeLabel: V4_SCHEMES[details.scheme] || 'Not scheme-specific',
    audienceLabel: listOr(details.audience, V4_AUDIENCE, 'Not provided'),
    systemsLabel: listOr(details.systems, V4_SYSTEMS, 'None')
  })
})

router.post('/v4/upload-guide/check', (req, res) => {
  res.redirect('/v4/upload-guide/converted')
})

// The success page — no quality checks, so it offers to view the converted
// guidance rather than fix findings.
router.get('/v4/upload-guide/converted', (req, res) => {
  const details = req.session.data.v4UploadedGuide
  if (!details) return res.redirect('/v4/upload-guide')

  res.render('versions/v4/upload-converted', { guideName: details.name })
})

// A read-only view of the converted guidance on one page, with a contents
// list down the left — the two-column reading layout v2 used, but without
// its page-by-page stepping. The shared sample document is rendered client-
// side by the app-guide-view module, which also builds the contents from
// the rendered section headings. No editing, no quality checks.
//
// The document's own leading title is stripped, since the page heading
// already shows it — so it does not appear twice.
router.get('/v4/upload-guide/view', (req, res) => {
  const details = req.session.data.v4UploadedGuide
  if (!details) return res.redirect('/v4/upload-guide')

  res.locals.backHref = '/v4/upload-guide/converted'
  res.render('versions/v4/guide-view', {
    guideName: details.name,
    markdown: v4SampleDocument.replace(/^#[^\n]*\n+/, '')
  })
})
