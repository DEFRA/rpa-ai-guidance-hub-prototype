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
// v5 only — the generic 3-phase placeholder content saved-document-view.html
// and editor-experiment.html both fall back to for a guidanceDocuments entry
// with no "steps" of its own. See the comment at the top of that file.
const { documents: genericGuidanceContent } = require('./data/generic-guidance-content')
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

// The header partial (app/views/partials/defra-header.njk) reads
// serviceName as a template global from app/config.json, which is "RPA
// Guidance Hub" for the current (v2) product. The v1 snapshot is a frozen
// record of what that header used to say, so it overrides back to the
// original name here rather than picking up config.json's value like every
// other page does. isV1/isV5/isV5SignIn similarly let that same partial
// pick the right Sign in/out link for whichever version — and page — is
// being viewed: v1 keeps its own unwired "Sign in" → "#" placeholder (it
// has no sign-in page of its own); /v5/sign-in itself also reads "Sign in"
// → "#" for the same reason v1's does — a visitor there has not signed in
// yet, so a header that already says "Sign out" would be inconsistent;
// every other v5 page (i.e. isV5 but not isV5SignIn — reached only after
// clicking "Sign in with your Defra account" on that page) gets "Sign out"
// → /v5/sign-in; v2/everything else keeps "Sign out" → /v2/sign-in exactly
// as before. The only differences between these headers are these
// res.locals, not separate copies of the partial.
//
// v5 also gets its own "Find guidance"/"Manage guidance" service navigation
// bar — the green strip in defra-header.njk, already built and already
// wired up to read res.locals.navigation (see the "Items for the Defra
// service navigation bar" router.use() above, which sets it to [] and
// falls back to a plain brand border), just never populated for any
// version until now. Overriding res.locals.navigation again here — this
// middleware runs after that one — replaces the (empty) site-wide default
// with these two items for /v5/... requests only, leaving v1 and v2
// exactly as they already were (still the plain border, still driven by
// the untouched top-level `navigation` array). "Current" is worked out by
// path prefix, not exact match like the site-wide version above, since a
// tab should stay highlighted across its whole page cluster — Find
// guidance for every /v5/find-guidance/... and /v5/document-overview/...
// page (organic search, document overview, the document itself, all
// reached from find-guidance.html), Manage guidance for every
// /v5/all-guidance-docs, /v5/guidance-document/... and /v5/manage-guidance/...
// page (its own search results and document overview). Neither tab
// highlights on start/editor-experiment, same as a real top nav showing no
// active tab on pages outside both sections — and the bar does not render
// at all on /v5/sign-in (isV5SignIn skips the override below, leaving
// res.locals.navigation at the site-wide empty default from above, so the
// header falls back to the plain brand border there, same as v1/v2): it
// sits before the hub's own navigation begins, not one of its sections.
const V5_NAVIGATION = [
  { text: 'Find guidance', href: '/v5/find-guidance', prefixes: ['/v5/find-guidance', '/v5/document-overview'] },
  { text: 'Manage guidance', href: '/v5/all-guidance-docs', prefixes: ['/v5/all-guidance-docs', '/v5/guidance-document', '/v5/manage-guidance'] }
]

router.use((req, res, next) => {
  if (req.path.startsWith('/v1/')) {
    res.locals.serviceName = 'RPA AI Guidance Hub'
    res.locals.isV1 = true
  } else if (req.path.startsWith('/v5/')) {
    res.locals.isV5 = true

    if (req.path === '/v5/sign-in') {
      res.locals.isV5SignIn = true
    } else {
      res.locals.navigation = V5_NAVIGATION.map((item) => ({
        text: item.text,
        href: item.href,
        current: item.prefixes.some((prefix) => req.path.startsWith(prefix))
      }))
    }
  }
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

// The entry point for the whole /v2/ prototype, before /v2/start — the
// versions list's own "Version 2 (current)" link now points here instead of
// straight to /v2/start (see app/views/index.html). /v2/start itself is
// still a real route below and stays reachable directly; this is just the
// intended front door now, not a lock on the old one.
router.get('/v2/sign-in', (req, res) => {
  res.render('sign-in')
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

// Session-backed "Recently opened" and "Saved guidance" lists for
// find-guidance.html — req.session.data.recentlyOpened/savedGuidance, each
// an array of { id, lastModified } (id being a guidance-documents.js id),
// most-recently-touched entry first. Seeded with the original fixed example
// rows the first time either is read in a given session, so every existing
// research script still starts from the same 4/3 rows; everything from
// there on is real session state — opening a document (recentlyOpened, see
// GET /find-guidance/document/:id below) or clicking "Save to search" on
// document-overview.html (savedGuidance, see POST
// /find-guidance/save-to-search below) adds to or bumps an entry, and
// "Yes, remove" on delete-search-confirm.html (see POST
// /find-guidance/remove below) removes one, from whichever of the two lists
// it came from. This is scoped entirely to /find-guidance and the routes
// that feed it — nothing else in the prototype (all-guidance-docs.html's
// own tabs included) reads either array.
const RECENTLY_OPENED_LIMIT = 5

function getRecentlyOpened (req) {
  if (!req.session.data.recentlyOpened) {
    req.session.data.recentlyOpened = [
      { id: 'cs-ma-revenue-options-claim-rule-signoff-2026', lastModified: '20 July 2026' },
      { id: 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026', lastModified: '15 August 2026' },
      { id: 'cs-ma-agreement-level-options-not-verified-2026', lastModified: '8 August 2026' },
      { id: 'cs-ma-claim-refresh-signoff-check-2026', lastModified: '1 August 2026' }
    ]
  }
  return req.session.data.recentlyOpened
}

function getSavedGuidance (req) {
  if (!req.session.data.savedGuidance) {
    req.session.data.savedGuidance = [
      { id: 'countryside-stewardship-capital-grants', lastModified: '20 July 2025' },
      { id: 'basic-payment-scheme-closing-rules', lastModified: '12 June 2025' },
      { id: 'sfi-soil-health-actions', lastModified: '3 May 2025' }
    ]
  }
  return req.session.data.savedGuidance
}

// A tab param, as already carried by find-guidance.html's own Remove links
// (?tab=recently-opened/saved-guidance) and REMOVE_CONFIRM_TABS below, to
// whichever session array that tab is backed by — used by the remove route
// to know which list to take an id out of.
function getListForTab (req, tabParam) {
  if (tabParam === 'recently-opened') return getRecentlyOpened(req)
  if (tabParam === 'saved-guidance') return getSavedGuidance(req)
  return null
}

// e.g. "4 September 2026" — the same day/full-month/year shape every
// lastModified value already uses, throughout guidance-documents.js and
// find-guidance.html's two lists alike.
function formatToday () {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
}

// Adds id to the front of list with today's date — or, if it is already
// there, removes the old entry first, so it moves to the front with an
// updated date rather than appearing twice.
function touchEntry (list, id) {
  const existingIndex = list.findIndex((entry) => entry.id === id)
  if (existingIndex !== -1) list.splice(existingIndex, 1)
  list.unshift({ id, lastModified: formatToday() })
}

function addRecentlyOpened (req, id) {
  const list = getRecentlyOpened(req)
  touchEntry(list, id)
  if (list.length > RECENTLY_OPENED_LIMIT) list.length = RECENTLY_OPENED_LIMIT
}

function addSavedGuidance (req, id) {
  touchEntry(getSavedGuidance(req), id)
}

// Builds find-guidance.html's table rows from a session list (id +
// lastModified) by looking up each id's title/version in guidanceDocuments
// — an id with no match is skipped rather than breaking the page (would
// only happen if guidance-documents.js ever lost an entry a session still
// references).
function buildFindGuidanceRows (list) {
  return list.reduce((rows, entry) => {
    const document = guidanceDocuments.find((candidate) => candidate.id === entry.id)
    if (!document) return rows
    rows.push({
      id: document.id,
      title: document.title,
      version: document.version,
      lastModified: entry.lastModified
    })
    return rows
  }, [])
}

// Not designed yet — a placeholder so "Find and locate guidance" leads
// somewhere rather than a 404. See app/views/find-guidance.html.
//
// Both tabs' rows are built from the session-backed lists above — see
// buildFindGuidanceRows — rather than from res.locals.guidedSearches/
// favouritedGuidance (still set above, for other pages) — those two files
// predate guidance-documents.js and do not have the version field this
// page's rows now need.
router.get('/find-guidance', (req, res) => {
  // No backHref — find-guidance.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const recentlyOpenedDocuments = buildFindGuidanceRows(getRecentlyOpened(req))
  const savedGuidanceDocuments = buildFindGuidanceRows(getSavedGuidance(req))

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
// this page can say which document, from which list — see
// app/views/delete-search-confirm.html. tab's anchor is "favourited-guidance"
// for saved-guidance specifically, matching that tab's own id in the
// govukTabs call on find-guidance.html (its label reads "Saved guidance",
// but the id/anchor was never renamed to match). A direct visit with no
// id/tab, or one that matches neither, falls back to a generic message
// rather than erroring. "Yes, remove" itself is a real POST — see
// /find-guidance/remove below — id/tab are carried into it as hidden form
// fields (documentId/tabParam here) rather than read back off this GET's
// own query string a second time.
const REMOVE_CONFIRM_TABS = {
  'recently-opened': { listName: 'Recently opened', anchor: 'recently-opened' },
  'saved-guidance': { listName: 'Saved guidance', anchor: 'favourited-guidance' }
}

router.get('/find-guidance/remove-confirm', (req, res) => {
  const document = guidanceDocuments.find((candidate) => candidate.id === req.query.id)
  const tab = REMOVE_CONFIRM_TABS[req.query.tab]

  res.locals.backHref = '/find-guidance'
  res.render('delete-search-confirm', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: tab ? tab.listName : null,
    returnHref: tab ? '/find-guidance#' + tab.anchor : '/find-guidance'
  })
})

// "Yes, remove" on delete-search-confirm.html — a real POST now, rather
// than a link straight to returnHref: this actually takes the entry out of
// req.session.data.recentlyOpened or .savedGuidance (chosen by ?tab=,
// carried through remove-confirm above as a hidden field of the same
// name), so it stays gone on the next visit to find-guidance.html rather
// than only looking removed until the session's underlying array is read
// again. Falls back to just redirecting straight back if id/tab don't
// resolve to a real list (a direct/bookmarked visit with bad params) —
// same as remove-confirm above already does for its own display.
router.post('/find-guidance/remove', (req, res) => {
  const tab = REMOVE_CONFIRM_TABS[req.body.tab]
  const list = getListForTab(req, req.body.tab)

  if (list && req.body.id) {
    const index = list.findIndex((entry) => entry.id === req.body.id)
    if (index !== -1) list.splice(index, 1)
  }

  res.redirect(tab ? '/find-guidance#' + tab.anchor : '/find-guidance')
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
// A guidanceDocuments entry can carry its own "steps" array (currently
// cs-ma-revenue-options-claim-rule-signoff-2026,
// cs-ma-land-user-or-land-cover-not-compatible-signoff-2026 and
// cs-revenue-claims-processing-final-payment-guide do) — when it does, that
// replaces the generic placeholder content entirely, and which step is
// showing is server-side state driven by ?step=, not client-side JS like the
// generic flow's Back/Next. req.query.step is clamped to a valid step
// number, defaulting to 1, so an out-of-range or missing/non-numeric step
// never breaks the page.
//
// "steps" comes in two shapes. The original, still used by the two
// cs-ma-*-2026 documents, is flat: one step per array entry, each with its
// own body — customSteps/currentStep below are that array and its current
// entry, unchanged from how this route has always worked. The newer nested
// shape (cs-revenue-claims-processing-final-payment-guide) groups smaller
// sub-steps under each top-level section as a "parts" array — detected by
// the first step having its own "parts" array rather than a "body". That
// gets flattened here into customParts (every part in section order, each
// carrying its own section's number/name alongside its own partName/
// heading/body) plus customSections (just the 4 section names, with each
// one's firstPartNumber, for the sidebar — see saved-document-view.html).
// currentStep/stepNumber/totalSteps then refer to a *part* rather than a
// whole section, so Back/Next (which only ever move stepNumber by 1) walk
// through every part in every section in one continuous sequence, crossing
// from one section's last part into the next section's first part exactly
// the same way they already move between sections in the flat shape.
//
// Back now returns to this document's own document-overview.html (rather
// than /find-guidance) — the same page "Open" there was clicked from, with
// whichever ?from= it arrived with (search/find-guidance/none) carried
// straight through, so that page's own breadcrumb trail is exactly as it
// was. document-overview.html/:id is a valid destination for every id this
// route ever sees, so this never needs a further fallback of its own.
router.get('/find-guidance/document/:id', (req, res) => {
  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === req.params.id)
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/document-overview/' + req.params.id + (req.query.from ? '?from=' + req.query.from : '')

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : legacyDocument ? legacyDocument.name : guidanceDocuments[0].title
  // Legacy savedDocuments/searchResults entries have a status, not a
  // version — every id that matters here is also in guidanceDocuments
  // though (see the comment above), so this only ever falls back to
  // guidanceDocuments[0].version for a genuinely unmatched id.
  const version = guidanceDocument ? guidanceDocument.version : guidanceDocuments[0].version

  // Tracks this as a "recently opened" document — but only on the actual
  // entry into it (the "Open" button on document-overview.html links here
  // with no ?step=), not on every subsequent Back/Next/sidebar/dropdown/
  // search navigation between its own steps, which all stay on this same
  // route with a ?step= of their own. A legacy savedDocuments/searchResults
  // id with no guidanceDocuments match is never tracked, since
  // buildFindGuidanceRows (see the /find-guidance route above) would just
  // skip it anyway.
  if (guidanceDocument && !req.query.step) {
    addRecentlyOpened(req, guidanceDocument.id)
  }

  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const customParts = []
      const customSections = guidanceDocument.steps.map((section) => {
        const firstPartNumber = customParts.length + 1
        section.parts.forEach((part) => {
          customParts.push({
            partNumber: customParts.length + 1,
            sectionNumber: section.sectionNumber,
            sectionName: section.sectionName,
            partName: part.partName,
            heading: part.heading,
            body: part.body
          })
        })
        return {
          sectionNumber: section.sectionNumber,
          sectionName: section.sectionName,
          firstPartNumber
        }
      })

      const totalSteps = customParts.length
      const requestedStep = parseInt(req.query.step, 10)
      const stepNumber = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

      res.render('saved-document-view', {
        id: req.params.id,
        documentName,
        version,
        customParts,
        customSections,
        currentStep: customParts[stepNumber - 1],
        stepNumber,
        totalSteps
      })
      return
    }

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

// Search by document name, date or type — now genuinely wired up, entirely
// client-side (see the script in app/views/organic-search.html): this route
// still renders the same fixed set of results server-side, unfiltered, so
// the page has something to show with JS disabled, but resultsJson (a slim
// id/title/description/version/dates/category/scheme/year copy, dropping
// the fuller fields like steps/versions this page's own script never needs)
// is what that script actually searches, filters and sorts against — the
// guidanceDocuments entries flagged showOnOrganicSearch, not every entry in
// that file — it also holds a few documents (see find-guidance.html's
// "Saved guidance" tab) that were never organic-search results to begin
// with.
router.get('/find-guidance/organic-search', (req, res) => {
  // No backHref — organic-search.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const organicSearchResults = guidanceDocuments.filter((document) => document.showOnOrganicSearch)

  res.render('organic-search', {
    results: organicSearchResults,
    resultsJson: JSON.stringify(organicSearchResults.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      lastUpdated: document.lastUpdated,
      published: document.published,
      category: document.category,
      scheme: document.scheme,
      year: document.year
    })))
  })
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
// ?from= (set by whichever page's own link led here — organic-search.html
// or find-guidance.html) tells the template which breadcrumb trail to show;
// an unset or unrecognised value falls back to the original fixed one there,
// so this never breaks for a direct visit.
router.get('/document-overview/:id', (req, res) => {
  const document =
    guidanceDocuments.find((candidate) => candidate.id === req.params.id) ||
    guidanceDocuments[0]

  // No backHref — document-overview.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('document-overview', {
    document,
    from: req.query.from,
    defaultVersionKey: document.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(document.versions)
  })
})

// Server-side counterpart to document-overview.html's "Save to search"
// button — see the fetch call in its pageScripts block. The button itself
// still flips to "Saved" and reveals the success notification banner
// entirely client-side and instantly, with no page reload/wait; this just
// persists the document into req.session.data.savedGuidance in the
// background, via addSavedGuidance (see the /find-guidance route far
// above), so it actually shows up on find-guidance.html's "Saved guidance"
// tab afterwards, rather than the button's own success state being the only
// trace it happened. Responds with no body either way — the client-side
// fetch call doesn't do anything with the response, and there is nothing
// real to fail here for a prototype.
router.post('/find-guidance/save-to-search', (req, res) => {
  if (req.body && req.body.id) {
    addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
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

// Add your routes here

// Standalone design experiment — not linked from anywhere else yet, and not
// part of the v1 snapshot or any live journey. Hardcoded sample data lives
// in the view itself, so no session/form logic is needed here.
router.get('/v2/editor-experiment', (req, res) => {
  res.render('v2/editor-experiment')
})

// ===========================================================================
// Version 5 — a duplicate of the v2 (current) prototype's own main flow, at
// app/views/versions/v5/. See app/views/index.html, the versions list this
// belongs to. v2 is now frozen from this point on — the same treatment v1
// already had — so v5 exists as where any further work on this flow
// continues; v2's own routes and views above are untouched by this block and
// should not be edited going forward.
//
// Every route below is the /v5-prefixed mirror of one specific named set of
// live routes — sign-in, start, the whole find-guidance/organic-search/
// document-overview/saved-document-view cluster, and all-guidance-docs/
// guidance-document(+edit)(+review), plus editor-experiment — not literally
// everything reachable from "/". "Create or upload guidance" on
// all-guidance-docs.html, and everything behind it (create-guidance.html,
// the designer/migrate/* upload wizard, designer/update-existing-guide.html)
// is intentionally left pointing at its existing shared, unprefixed route —
// outside the scope of this duplication — so a v5 visitor who goes that far
// ends up on the shared /all-guidance-docs, not /v5/all-guidance-docs, if
// they then click Back. Same idea for the designer/documents/findings/*
// review sub-journey, which neither guidance-document.html nor
// change-review.html actually link to.
//
// Same logic as each live handler, rendering from versions/v5/... instead of
// the live view and redirecting/linking to other /v5/... paths rather than
// live ones — deliberately not sharing handler functions with the live
// routes, same reasoning as v1: a frozen-going-forward v2 should not change
// behaviour just because this new v5 handler is edited later. Path-free
// values are reused as-is rather than redefined here, since they are data,
// not logic that could drift: guidanceDocuments/library/guidedSearches (the
// data files — explicitly shared per the task this was built from, since v2
// no longer changes anyway), VERDICTS/TOTAL_REVIEW_ISSUES/
// DEFAULT_AI_SEARCH_QUERY/DEFAULT_TOTAL_STEPS/DEFAULT_STEP/
// RECENTLY_OPENED_LIMIT/REMOVE_CONFIRM_TABS (constants), and slugify (a pure
// function with no paths in it).
//
// Not namespaced: session data (recentlyOpened, savedGuidance, verdicts, the
// AI search query, activeJourney) is shared between v5 and the live pages —
// both read and write the same session keys, via the same
// getRecentlyOpened/getSavedGuidance/addRecentlyOpened/addSavedGuidance/
// getListForTab/touchEntry/buildFindGuidanceRows helper functions above,
// called directly rather than duplicated. Same simplification v1 already
// documents above: the point of a snapshot/duplicate is a frozen (or, here,
// forked-forward) set of pages and links, not isolated persisted state — so
// opening a document in v5 also marks it recently opened if the live
// find-guidance.html is opened in the same browser session, and vice versa.
// ===========================================================================

router.get('/v5/sign-in', (req, res) => {
  res.render('versions/v5/sign-in')
})

router.get('/v5/start', (req, res) => {
  // Starting fresh clears any variant left over from a previous run.
  delete req.session.data.activeJourney
  res.render('versions/v5/start')
})

router.get('/v5/find-guidance', (req, res) => {
  // No backHref — find-guidance.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const recentlyOpenedDocuments = buildFindGuidanceRows(getRecentlyOpened(req))
  const savedGuidanceDocuments = buildFindGuidanceRows(getSavedGuidance(req))

  res.render('versions/v5/find-guidance', { recentlyOpenedDocuments, savedGuidanceDocuments })
})

router.get('/v5/find-guidance/new', (req, res) => {
  res.locals.backHref = '/v5/find-guidance'
  res.render('versions/v5/find-guidance-new')
})

router.post('/v5/find-guidance/new', (req, res) => {
  res.redirect(
    req.body.searchMethod === 'ai' ? '/v5/find-guidance/ai-search' : '/v5/find-guidance/organic-search'
  )
})

router.get('/v5/find-guidance/remove-confirm', (req, res) => {
  const document = guidanceDocuments.find((candidate) => candidate.id === req.query.id)
  const tab = REMOVE_CONFIRM_TABS[req.query.tab]

  res.locals.backHref = '/v5/find-guidance'
  res.render('versions/v5/delete-search-confirm', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: tab ? tab.listName : null,
    returnHref: tab ? '/v5/find-guidance#' + tab.anchor : '/v5/find-guidance'
  })
})

router.post('/v5/find-guidance/remove', (req, res) => {
  const tab = REMOVE_CONFIRM_TABS[req.body.tab]
  const list = getListForTab(req, req.body.tab)

  if (list && req.body.id) {
    const index = list.findIndex((entry) => entry.id === req.body.id)
    if (index !== -1) list.splice(index, 1)
  }

  res.redirect(tab ? '/v5/find-guidance#' + tab.anchor : '/v5/find-guidance')
})

router.get('/v5/find-guidance/document/:id', (req, res) => {
  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === req.params.id)
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref = '/v5/document-overview/' + req.params.id + (req.query.from ? '?from=' + req.query.from : '')

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : legacyDocument ? legacyDocument.name : guidanceDocuments[0].title
  const version = guidanceDocument ? guidanceDocument.version : guidanceDocuments[0].version

  if (guidanceDocument && !req.query.step) {
    addRecentlyOpened(req, guidanceDocument.id)
  }

  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const customParts = []
      const customSections = guidanceDocument.steps.map((section) => {
        const firstPartNumber = customParts.length + 1
        section.parts.forEach((part) => {
          customParts.push({
            partNumber: customParts.length + 1,
            sectionNumber: section.sectionNumber,
            sectionName: section.sectionName,
            partName: part.partName,
            heading: part.heading,
            body: part.body
          })
        })
        return {
          sectionNumber: section.sectionNumber,
          sectionName: section.sectionName,
          firstPartNumber
        }
      })

      const totalSteps = customParts.length
      const requestedStep = parseInt(req.query.step, 10)
      const stepNumber = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

      res.render('versions/v5/saved-document-view', {
        id: req.params.id,
        documentName,
        version,
        customParts,
        customSections,
        currentStep: customParts[stepNumber - 1],
        stepNumber,
        totalSteps,
        documents: genericGuidanceContent
      })
      return
    }

    const totalSteps = guidanceDocument.steps.length
    const requestedStep = parseInt(req.query.step, 10)
    const stepNumber = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

    res.render('versions/v5/saved-document-view', {
      id: req.params.id,
      documentName,
      version,
      customSteps: guidanceDocument.steps,
      currentStep: guidanceDocument.steps[stepNumber - 1],
      stepNumber,
      totalSteps,
      documents: genericGuidanceContent
    })
    return
  }

  res.render('versions/v5/saved-document-view', {
    id: req.params.id,
    documentName,
    version,
    documents: genericGuidanceContent
  })
})

router.get('/v5/find-guidance/organic-search', (req, res) => {
  // No backHref — organic-search.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const organicSearchResults = guidanceDocuments.filter((document) => document.showOnOrganicSearch)

  res.render('versions/v5/organic-search', {
    results: organicSearchResults,
    // Pre-fills and immediately applies the search box on find-guidance.html
    // (?q=, a plain GET <form> there — see that template) — the template's
    // own script reads this same value back off the pre-filled input rather
    // than this being passed to it directly, so a direct visit with no q
    // behaves exactly as before (empty string, nothing pre-applied).
    initialSearchQuery: (req.query.q || '').trim(),
    resultsJson: JSON.stringify(organicSearchResults.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      lastUpdated: document.lastUpdated,
      published: document.published,
      category: document.category,
      scheme: document.scheme,
      year: document.year
    })))
  })
})

router.get('/v5/document-overview/:id', (req, res) => {
  const document =
    guidanceDocuments.find((candidate) => candidate.id === req.params.id) ||
    guidanceDocuments[0]

  // No backHref — document-overview.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v5/document-overview', {
    document,
    from: req.query.from,
    defaultVersionKey: document.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(document.versions)
  })
})

router.post('/v5/find-guidance/save-to-search', (req, res) => {
  if (req.body && req.body.id) {
    addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
})

router.get('/v5/find-guidance/ai-search', (req, res) => {
  res.locals.backHref = '/v5/find-guidance/new'
  res.render('versions/v5/ai-search')
})

router.post('/v5/find-guidance/ai-search-loading', (req, res) => {
  req.session.data.aiSearchQuery = (req.body.query || '').trim()
  res.redirect('/v5/find-guidance/ai-search-loading')
})

router.get('/v5/find-guidance/ai-search-loading', (req, res) => {
  res.render('versions/v5/ai-search-loading')
})

function renderV5AiSearchResults (req, res) {
  const search = guidedSearches.find((candidate) => candidate.id === req.params.id)
  const id = search ? search.id : 'new'
  const totalSteps = search ? search.totalSteps : DEFAULT_TOTAL_STEPS
  const startingStep = search ? search.resumeStep : DEFAULT_STEP

  const step = Math.min(
    Math.max(Number(req.params.step) || startingStep, 1),
    totalSteps
  )

  res.render('versions/v5/ai-search-results', {
    id,
    step,
    totalSteps,
    query: req.session.data.aiSearchQuery || DEFAULT_AI_SEARCH_QUERY,
    backHref:
      step > 1
        ? `/v5/find-guidance/ai-search-results/${id}/${step - 1}`
        : (search ? '/v5/find-guidance' : '/v5/find-guidance/ai-search'),
    backLinkHref: '/v5/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps ? `/v5/find-guidance/ai-search-results/${id}/${step + 1}` : '/v5/find-guidance'
  })
}

router.get('/v5/find-guidance/ai-search-results', renderV5AiSearchResults)
router.get('/v5/find-guidance/ai-search-results/:id', renderV5AiSearchResults)
router.get('/v5/find-guidance/ai-search-results/:id/:step', renderV5AiSearchResults)

// Manage guidance (v5 only) — the "Editing"/"Awaiting approval" rows shared
// by GET /v5/all-guidance-docs below, its search results page (GET
// /v5/manage-guidance-search) and its document overview page (GET
// /v5/manage-guidance/document-overview). Each row is a real
// guidance-documents.js document now — looked up here by title, for its id
// (the Document name link's ?id=, and what /v5/guidance-document/:id/edit
// is built from) and version (the Version column/tag) — rather than the
// placeholder names this page originally had.
//
// publishingChecks/changesRequested/lastModified are all still placeholder
// values, not real quality-check/edit-history data: each list below
// carries the exact same publishingChecks/changesRequested this function
// always returned, at the exact same position, just relabelled onto a real
// title rather than reshuffled — row 1 of Editing was 19 issues/0 changes
// requested before real titles replaced the placeholder names here, and
// still is. Only all-guidance-docs.html/manage-guidance-search.html's own
// shared table macro actually shows lastModified now (Document name |
// Version | Last modified, replacing the Publishing checks/Changes
// requested columns there) — publishingChecks/changesRequested are kept on
// every row regardless, since /v5/manage-guidance/document-overview.html's
// own summary list still shows both of those, unchanged by this.
//
// "Hedgerow management standards" (Awaiting approval, row 3) did not exist
// in guidance-documents.js before an earlier change — see the entry added
// there (right after sfi-soil-health-actions), added specifically so this
// row has a real version to look up rather than an invented one, the same
// as every other row here.
function lookupGuidanceDocumentByTitle (title) {
  const document = guidanceDocuments.find((candidate) => candidate.title === title)
  if (!document) throw new Error(`buildManageGuidanceRows: no guidance-documents.js entry titled "${title}"`)
  return document
}

// Ids removed from the Editing tab via "Remove" (there is no equivalent
// action on Awaiting approval) — session-backed, the same
// seed-on-first-read/persist-for-the-rest-of-the-session approach
// find-guidance.html's own recentlyOpened/savedGuidance already use (see
// getRecentlyOpened/getSavedGuidance above), just simpler: a list of
// removed ids to filter *out* of the Editing list every time it is built,
// rather than the list itself, since Editing's own rows are always
// rebuilt fresh from guidanceDocuments/the fixed placeholder counts above
// rather than kept in session as data.
function getRemovedEditingIds (req) {
  if (!req.session.data.manageGuidanceEditingRemovedIds) {
    req.session.data.manageGuidanceEditingRemovedIds = []
  }
  return req.session.data.manageGuidanceEditingRemovedIds
}

// The reverse of getRemovedEditingIds above — ids of sample Published
// documents (MANAGE_GUIDANCE_PUBLISHED_SAMPLES, further down this file;
// referencing it here from a function defined earlier is safe, since
// every module-level const has already been evaluated top-to-bottom by
// the time any route handler actually runs) that "Start editing" on
// /v5/manage-guidance/document-overview.html has moved into Editing this
// session — see POST /v5/manage-guidance/start-editing below.
// buildManageGuidanceRows folds these into editingDocuments alongside the
// fixed 9, and buildManageGuidanceSearchResults excludes them from the
// Published list it builds, so a moved document appears in exactly one
// state at a time, never both.
function getAddedEditingIds (req) {
  if (!req.session.data.manageGuidanceEditingAddedIds) {
    req.session.data.manageGuidanceEditingAddedIds = []
  }
  return req.session.data.manageGuidanceEditingAddedIds
}

function buildManageGuidanceRows (req) {
  const editing = [
    { title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026', publishingChecks: 19, changesRequested: 0, lastModified: '6 September 2026' },
    { title: 'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026', publishingChecks: 8, changesRequested: 0, lastModified: '5 September 2026' },
    { title: 'CS MA Claim - Agreement Level Options not Verified 2026', publishingChecks: 34, changesRequested: 0, lastModified: '3 September 2026' },
    { title: 'CS MA Claim - Claim Refresh Signoff Check 2026', publishingChecks: 1, changesRequested: 0, lastModified: '1 September 2026' },
    { title: 'CS MA - Evidence Required', publishingChecks: 7, changesRequested: 0, lastModified: '30 August 2026' },
    { title: 'CS MA - Parcel not Under Control of SBI at Signoff 2026', publishingChecks: 0, changesRequested: 0, lastModified: '28 August 2026' },
    { title: 'CS MA Claim - AB12 or OP3 Maximum Eligible Weight 2026', publishingChecks: 3, changesRequested: 2, lastModified: '25 August 2026' },
    { title: 'CS MA Claim - Existing 2026', publishingChecks: 0, changesRequested: 0, lastModified: '20 August 2026' },
    { title: 'CS Revenue Claims Processing to Final Payment Guide', publishingChecks: 5, changesRequested: 1, lastModified: '7 September 2026' }
  ]

  const awaitingApproval = [
    { title: 'Countryside Stewardship: capital grants', publishingChecks: 0, changesRequested: 0, lastModified: '18 August 2026' },
    { title: 'Basic Payment Scheme: closing rules', publishingChecks: 2, changesRequested: 1, lastModified: '15 August 2026' },
    { title: 'Hedgerow management standards', publishingChecks: 0, changesRequested: 0, lastModified: '10 August 2026' },
    { title: 'Sustainable Farming Incentive: soil health actions', publishingChecks: 4, changesRequested: 1, lastModified: '5 August 2026' }
  ]

  const buildRows = (entries) => entries.map((entry) => {
    const document = lookupGuidanceDocumentByTitle(entry.title)
    return {
      id: document.id,
      name: document.title,
      version: document.version,
      publishingChecks: entry.publishingChecks,
      changesRequested: entry.changesRequested,
      lastModified: entry.lastModified
    }
  })

  // A sample Published document moved into Editing via "Start editing" has
  // no guidance-documents.js entry to look up (it only ever existed in
  // MANAGE_GUIDANCE_PUBLISHED_SAMPLES) and no placeholder
  // publishingChecks/changesRequested/lastModified of its own either, so
  // those are given sensible just-started defaults here instead: no
  // checks have run and no changes have been requested yet, and it was
  // last modified today (formatToday(), the same "4 September 2026" style
  // date find-guidance.html's own session-tracked lists already use).
  const addedEditingIds = getAddedEditingIds(req)
  const addedFromPublished = MANAGE_GUIDANCE_PUBLISHED_SAMPLES
    .filter((document) => addedEditingIds.indexOf(document.id) !== -1)
    .map((document) => ({
      id: document.id,
      name: document.title,
      version: document.version,
      publishingChecks: 0,
      changesRequested: 0,
      lastModified: formatToday()
    }))

  const removedEditingIds = getRemovedEditingIds(req)

  return {
    editingDocuments: buildRows(editing)
      .concat(addedFromPublished)
      .filter((document) => removedEditingIds.indexOf(document.id) === -1),
    awaitingApprovalDocuments: buildRows(awaitingApproval)
  }
}

router.get('/v5/all-guidance-docs', (req, res) => {
  // No backHref — all-guidance-docs.html shows breadcrumbs instead of a
  // Back link now (see the template).
  const { editingDocuments, awaitingApprovalDocuments } = buildManageGuidanceRows(req)

  res.render('versions/v5/all-guidance-docs', { editingDocuments, awaitingApprovalDocuments })
})

// The search box on all-guidance-docs.html, directly below "Create or
// upload guidance" — a plain GET <form>, same reasoning as the one on
// find-guidance.html: it only ever needs to hand a term off to this page,
// not filter anything itself, so Enter/Search both just submit it
// natively. Matches on document name only (a case-insensitive substring
// match), across both Editing and Awaiting approval — Published is not
// searched either, since it is not shown on this page any more. An empty
// q shows no results rather than matching everything.
router.get('/v5/manage-guidance-search', (req, res) => {
  const query = (req.query.q || '').trim()
  const { editingDocuments, awaitingApprovalDocuments } = buildManageGuidanceRows(req)
  const allDocuments = editingDocuments.concat(awaitingApprovalDocuments)

  const results = query
    ? allDocuments.filter((document) => document.name.toLowerCase().includes(query.toLowerCase()))
    : []

  res.locals.backHref = '/v5/all-guidance-docs'
  res.render('versions/v5/manage-guidance-search', { query, results })
})

// The overview a Document name link on all-guidance-docs.html/
// manage-guidance-search.html/search-guidance.html now leads to, instead
// of straight into Edit or the old Action column's buttons — a stop in
// between, shaped differently depending on the document's state: an
// Editing/Awaiting approval document gets the original layout (Publishing
// checks/Changes requested/Status, "Continue editing" — see the template's
// {% else %} branch); a Published one gets Version/Version notes/Last
// updated/Published instead, plus "Start editing" rather than
// "Continue editing" (the template's {% if status == "Published" %}
// branch).
//
// ?id= is looked up against buildManageGuidanceRows() first (Editing, then
// Awaiting approval — an id can only be in one of the two, but checking
// both rather than assuming which saves the caller from having to say),
// then MANAGE_GUIDANCE_PUBLISHED_SAMPLES if neither matched. A Published
// match is reshaped to the same { id, name, ... } document shape the
// other two branches already pass (name rather than
// MANAGE_GUIDANCE_PUBLISHED_SAMPLES' own title field), so the template's
// heading/breadcrumb work unchanged regardless of which branch rendered
// them. An id that matches nothing at all — a stale/mistyped link —
// redirects back to /v5/all-guidance-docs rather than erroring or showing
// a broken page.
router.get('/v5/manage-guidance/document-overview', (req, res) => {
  const { editingDocuments, awaitingApprovalDocuments } = buildManageGuidanceRows(req)

  const editingMatch = editingDocuments.find((candidate) => candidate.id === req.query.id)
  const awaitingApprovalMatch = awaitingApprovalDocuments.find((candidate) => candidate.id === req.query.id)

  // No backHref on either render below — the template shows a breadcrumb
  // back to Manage guidance instead of a Back link.
  if (editingMatch || awaitingApprovalMatch) {
    res.render('versions/v5/manage-guidance/document-overview', {
      document: editingMatch || awaitingApprovalMatch,
      status: editingMatch ? 'Editing' : 'Awaiting approval'
    })
    return
  }

  const publishedMatch = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find((candidate) => candidate.id === req.query.id)

  if (!publishedMatch) {
    res.redirect('/v5/all-guidance-docs')
    return
  }

  res.render('versions/v5/manage-guidance/document-overview', {
    document: {
      id: publishedMatch.id,
      name: publishedMatch.title,
      version: publishedMatch.version,
      versionNotes: publishedMatch.versionNotes,
      lastUpdated: publishedMatch.lastUpdated,
      published: publishedMatch.published
    },
    status: 'Published'
  })
})

// "Start editing" on document-overview.html's Published branch — adds id
// to req.session.data.manageGuidanceEditingAddedIds (via
// getAddedEditingIds, used by buildManageGuidanceRows() every time it
// builds the Editing list), so the document moves from Published to
// Editing/Draft for the rest of the session: a later visit to this same
// document-overview page finds it via editingMatch above instead, and
// renders the normal Editing layout rather than this one. Straight on to
// the editor afterwards — the same /v5/editor-experiment?id= destination
// "Continue editing" already uses — rather than back to this page, since
// there is nothing further to confirm here. A POST with no id is simply a
// no-op redirect to the editor with no id of its own, which
// editor-experiment.html already handles gracefully (its own fixed sample
// content, same as a direct visit).
router.post('/v5/manage-guidance/start-editing', (req, res) => {
  if (req.body.id) {
    const addedIds = getAddedEditingIds(req)
    if (addedIds.indexOf(req.body.id) === -1) addedIds.push(req.body.id)
  }

  res.redirect('/v5/editor-experiment?id=' + encodeURIComponent(req.body.id || ''))
})

// Confirms removing a row from the Editing tab on all-guidance-docs.html —
// reached from that table's own "Remove" links (Awaiting approval has no
// such link), which carry ?id=. Only looks the id up against
// editingDocuments, not awaitingApprovalDocuments too — unlike
// /v5/manage-guidance/document-overview above, an Awaiting approval id
// reaching this page is exactly as unmatched as one that does not exist at
// all, since there is nothing here for it to remove. A direct visit with
// no id, or one that matches nothing, leaves documentTitle undefined, so
// the generic fallback in the template is shown instead of erroring.
router.get('/v5/manage-guidance/remove-confirm', (req, res) => {
  const { editingDocuments } = buildManageGuidanceRows(req)
  const document = editingDocuments.find((candidate) => candidate.id === req.query.id)

  res.locals.backHref = '/v5/all-guidance-docs'
  res.render('versions/v5/manage-guidance/remove-confirm', {
    documentId: req.query.id,
    documentTitle: document ? document.name : null
  })
})

// "Yes, remove" on remove-confirm.html above — adds id to
// req.session.data.manageGuidanceEditingRemovedIds (via
// getRemovedEditingIds, used by buildManageGuidanceRows() every time it
// builds the Editing list), so the document is filtered out of the count
// and table on every subsequent visit this session — then back to
// all-guidance-docs.html at the Editing tab's own #editing anchor
// (govuk-frontend's tabs.js selects whichever tab's id matches
// location.hash on load). A POST with no id is simply a no-op redirect,
// same graceful handling as find-guidance.html's equivalent route.
router.post('/v5/manage-guidance/remove', (req, res) => {
  if (req.body.id) {
    const removedIds = getRemovedEditingIds(req)
    if (removedIds.indexOf(req.body.id) === -1) removedIds.push(req.body.id)
  }

  res.redirect('/v5/all-guidance-docs#editing')
})

// A handful of sample "Published" documents for /v5/manage-guidance/
// search-guidance below — genuinely local to that page/dataset, not real
// guidance-documents.js entries: nothing in the Editing or Awaiting
// approval tabs ever reaches a "Published" state today (there is no route
// that moves a document there), so there is nothing real to reuse the way
// Editing/Awaiting approval's own rows do. Shaped the same as a
// guidance-documents.js entry (id/title/description/version/lastUpdated/
// published/category/scheme/year) so buildManageGuidanceSearchResults
// below can treat all three states uniformly, but kept here rather than
// added there — state is a Manage guidance-only concept, and adding these
// to the shared file would make them show up on the Find guidance side
// too (organic-search.html, find-guidance.html), which nothing in this
// task asked for.
const MANAGE_GUIDANCE_PUBLISHED_SAMPLES = [
  {
    id: 'cs-mid-tier-hedgerow-and-boundary-options',
    title: 'CS Mid Tier: hedgerow and boundary options',
    description: 'Explains the hedgerow and boundary management options available under a Mid Tier Countryside Stewardship agreement, and how they are assessed at application.',
    version: 'Version 2',
    versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.',
    lastUpdated: '12 July 2026',
    published: '3 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026
  },
  {
    id: 'sfi-nutrient-management-actions',
    title: 'SFI: nutrient management actions',
    description: 'Covers the nutrient management actions available under SFI, including record-keeping requirements and how they combine with other actions on the same land.',
    version: 'Version 1',
    versionNotes: 'Initial published version of this guidance.',
    lastUpdated: '28 May 2026',
    published: '9 January 2025',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2026
  },
  {
    id: 'cs-higher-tier-wetland-and-grassland-options',
    title: 'CS Higher Tier: wetland and grassland options',
    description: 'Sets out the wetland and species-rich grassland options available under a Higher Tier Countryside Stewardship agreement, and the evidence expected to support them.',
    version: 'Version 1',
    versionNotes: 'Initial published version of this guidance.',
    lastUpdated: '4 April 2026',
    published: '21 November 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026
  },
  {
    id: 'sfi-integrated-pest-management-actions',
    title: 'SFI: integrated pest management actions',
    description: 'Explains the integrated pest management actions available under SFI, how they are checked, and what evidence to keep to support a claim.',
    version: 'Version 2',
    versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.',
    lastUpdated: '19 August 2026',
    published: '14 October 2025',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2025
  }
]

// The dataset behind /v5/manage-guidance/search-guidance below — every
// document currently in the Editing or Awaiting approval tabs
// (buildManageGuidanceRows(), the same rows all-guidance-docs.html and
// manage-guidance-search.html already show), plus whichever sample
// Published documents have not been moved into Editing via "Start editing"
// (POST /v5/manage-guidance/start-editing) this session — each tagged with
// its own state ("Draft"/"Awaiting review"/"Published", a Manage
// guidance-only concept; see the comment on MANAGE_GUIDANCE_PUBLISHED_SAMPLES
// for why it does not live on guidance-documents.js itself).
//
// Editing/Awaiting approval rows are looked back up by id for the
// description/category/scheme/year/lastUpdated/published fields this
// page's cards need — buildManageGuidanceRows() itself only carries the
// placeholder publishingChecks/changesRequested/lastModified fields the
// *other* Manage guidance pages use, not these. That lookup checks
// guidanceDocuments first, then MANAGE_GUIDANCE_PUBLISHED_SAMPLES, rather
// than assuming guidanceDocuments — an Editing row can now come from
// either, if "Start editing" has moved a sample Published document across
// this session. overviewHref is always the real
// /v5/manage-guidance/document-overview page now, for every state: a
// sample Published document has one too since that route added a third
// (MANAGE_GUIDANCE_PUBLISHED_SAMPLES) fallback lookup of its own, not just
// Editing/Awaiting approval.
function lookupAnyManageGuidanceDocument (id) {
  return guidanceDocuments.find((candidate) => candidate.id === id) ||
    MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find((candidate) => candidate.id === id)
}

function buildManageGuidanceSearchResults (req) {
  const { editingDocuments, awaitingApprovalDocuments } = buildManageGuidanceRows(req)
  const addedEditingIds = getAddedEditingIds(req)

  const fromRows = (rows, state) => rows.map((row) => {
    const document = lookupAnyManageGuidanceDocument(row.id)
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      lastUpdated: document.lastUpdated,
      published: document.published,
      category: document.category,
      scheme: document.scheme,
      year: document.year,
      state,
      overviewHref: `/v5/manage-guidance/document-overview?id=${document.id}`
    }
  })

  const published = MANAGE_GUIDANCE_PUBLISHED_SAMPLES
    .filter((document) => addedEditingIds.indexOf(document.id) === -1)
    .map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      lastUpdated: document.lastUpdated,
      published: document.published,
      category: document.category,
      scheme: document.scheme,
      year: document.year,
      state: 'Published',
      overviewHref: `/v5/manage-guidance/document-overview?id=${document.id}`
    }))

  return fromRows(editingDocuments, 'Draft')
    .concat(fromRows(awaitingApprovalDocuments, 'Awaiting review'))
    .concat(published)
}

// A fully independent duplicate of /v5/find-guidance/organic-search above
// — same search/filter/sort mechanics, but its own dataset
// (buildManageGuidanceSearchResults, not guidanceDocuments filtered by
// showOnOrganicSearch) and its own State filter alongside
// Category/Scheme/Year/Version. Deliberately not sharing a template or any
// route logic with organic-search.html — see
// app/views/versions/v5/manage-guidance/search-guidance.html — so the two
// are safe to diverge further without either affecting the other. ?q=
// pre-fills and immediately applies the search box on all-guidance-docs.html,
// same mechanism as organic-search.html's own initialSearchQuery.
router.get('/v5/manage-guidance/search-guidance', (req, res) => {
  const searchResults = buildManageGuidanceSearchResults(req)

  res.render('versions/v5/manage-guidance/search-guidance', {
    results: searchResults,
    initialSearchQuery: (req.query.q || '').trim(),
    resultsJson: JSON.stringify(searchResults.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      lastUpdated: document.lastUpdated,
      published: document.published,
      category: document.category,
      scheme: document.scheme,
      year: document.year,
      state: document.state,
      overviewHref: document.overviewHref
    })))
  })
})

router.get('/v5/guidance-document/:id', (req, res) => {
  // No backHref — guidance-document.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v5/guidance-document')
})

router.get('/v5/guidance-document/:id/edit', (req, res) => {
  const uploaded = library.batch.find((document) => slugify(document.name) === req.params.id)

  res.locals.backHref = '/v5/all-guidance-docs'
  res.render('versions/v5/guidance-document-edit', {
    documentName: uploaded ? uploaded.name : library.current.name,
    documentPages: uploaded ? uploaded.pages : library.current.pages
  })
})

function renderV5ChangeReview (req, res) {
  const id = req.params.id
  const issueNumber = Math.min(
    Math.max(Number(req.params.issueNumber) || 1, 1),
    TOTAL_REVIEW_ISSUES
  )

  res.locals.backHref = `/v5/guidance-document/${id}`

  res.render('versions/v5/change-review', {
    issueNumber,
    totalIssues: TOTAL_REVIEW_ISSUES,
    previousIssueHref:
      issueNumber > 1 ? `/v5/guidance-document/${id}/review/${issueNumber - 1}` : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES ? `/v5/guidance-document/${id}/review/${issueNumber + 1}` : null
  })
}

router.get('/v5/guidance-document/:id/review', renderV5ChangeReview)
router.get('/v5/guidance-document/:id/review/:issueNumber', renderV5ChangeReview)

// Flattens a guidanceDocuments entry's own content into one entry per
// editor-experiment.html section, in one consistent shape regardless of
// which of the three content formats this prototype has (see
// app/views/versions/v5/saved-document-view.html for the same three
// shapes handled the same way, just for that page's own step-by-step view
// rather than one continuous scroll here): id (section-1, section-2, ...,
// matching the sidebar's #section-N anchors and the Comments/Checks
// panel's data-target-section values), name (the sidebar link text),
// heading (the h2 inside the content itself — the same text as name for
// every shape here, but kept as its own field for parity with the other
// two shapes, where a future document could reasonably want them to
// differ) and body (an array of paragraph strings/bullet-list arrays, the
// same shape saved-document-view.html's own step/part bodies already are).
// Returns null for a document with no content this route knows how to
// render at all (guidanceDocument itself not found) — the route below
// falls back to the fixed sample content for that, not this function.
// editor-experiment.html's seeded Comments (EDITOR_EXPERIMENT_COMMENTS
// below) turn out, in practice, to be reviewed against this one real
// document rather than only the fixed no-?id= sample they were originally
// anchored to — see the section.anchorId handling in the template's
// editorSections loop. Keyed by the generic section-N id
// buildEditorSections assigns below, since that is the one thing stable
// across a re-fetch of the same document; a document with no entry here
// (every other one) is returned completely unchanged by
// applyEditorHeadingAnchors further down. Same anchor-N values as the
// fixed sample's own hand-placed spans (comment.anchorId,
// EDITOR_EXPERIMENT_COMMENTS below) — only one of the two ever renders at
// once, so there is no collision.
const EDITOR_HEADING_ANCHORS = {
  'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026': {
    'section-1': { anchorId: 'anchor-1', anchorAuthor: 'Jane Smith' },
    'section-2': { anchorId: 'anchor-2', anchorAuthor: 'Tom Reeves' },
    'section-3': { anchorId: 'anchor-3', anchorAuthor: 'Priya Shah' }
  }
}

function applyEditorHeadingAnchors (documentId, sections) {
  const anchors = EDITOR_HEADING_ANCHORS[documentId]
  if (!anchors) return sections

  return sections.map((section) => {
    const anchor = anchors[section.id]
    return anchor ? { ...section, anchorId: anchor.anchorId, anchorAuthor: anchor.anchorAuthor } : section
  })
}

function buildEditorSections (guidanceDocument) {
  if (guidanceDocument.steps && guidanceDocument.steps.length) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const sections = []
      guidanceDocument.steps.forEach((section) => {
        section.parts.forEach((part) => {
          sections.push({
            id: `section-${sections.length + 1}`,
            name: part.partName,
            heading: part.heading,
            body: part.body
          })
        })
      })
      return applyEditorHeadingAnchors(guidanceDocument.id, sections)
    }

    return applyEditorHeadingAnchors(guidanceDocument.id, guidanceDocument.steps.map((step, index) => ({
      id: `section-${index + 1}`,
      name: step.sectionName,
      heading: step.heading,
      body: step.body
    })))
  }

  // The generic 3-phase placeholder flow — genericGuidanceContent falls
  // back to countryside-stewardship-capital-grants for an id with no
  // entry of its own, same as saved-document-view.html's own lookup.
  const genericDocument = genericGuidanceContent[guidanceDocument.id] || genericGuidanceContent['countryside-stewardship-capital-grants']
  const sections = []
  genericDocument.sections.forEach((section) => {
    section.subsections.forEach((subsection) => {
      sections.push({
        id: `section-${sections.length + 1}`,
        name: subsection.heading,
        heading: subsection.heading,
        body: subsection.content
      })
    })
  })
  return applyEditorHeadingAnchors(guidanceDocument.id, sections)
}

// Sample Comments data for /v5/editor-experiment's Changes panel — not
// document-specific (the same three show regardless of which document, if
// any, ?id= names), so kept separate from editorSections/buildEditorSections
// above. A comment with one or more replies renders as a threaded/accordion
// card on the page rather than a single flat one — see comment.replies |
// length in the template. Jane Smith's thread (comment-1) gets two sample
// replies and Priya Shah's (comment-3) gets one, so both card states show
// on a first visit; Tom Reeves' (comment-2) has none, showing the
// unchanged single-card state.
//
// anchorId links a comment to a specific span of editor text — a
// data-anchor-id="anchor-N" element sharing that value. Two sources
// produce one, depending on what is actually being viewed: a <span>
// hand-added to editor-experiment.html's own fixed "SFI 23" sample
// content (used when there is no ?id=, or one that matches nothing), or
// — for the one real document these comments are actually reviewed
// against, cs-ma-land-user-or-land-cover-not-compatible-signoff-2026 —
// the section heading itself, via EDITOR_HEADING_ANCHORS/
// applyEditorHeadingAnchors above. Only one of the two branches ever
// renders at once, so the same three anchor-N values are reused rather
// than needing separate ids per source. Any other real document has
// neither, so its comments simply have nothing to position against —
// see the template. section (still present and unchanged on all three)
// drives the separate, pre-existing click-card-to-highlight-a-whole-
// section behaviour, which anchors do not replace — the two coexist, one
// per comment, additively.
const EDITOR_EXPERIMENT_COMMENTS = [
  {
    id: 'comment-1',
    author: 'Jane Smith',
    timestamp: '2 days ago',
    text: 'This paragraph needs updating to reflect the new payment threshold.',
    section: 'section-1',
    anchorId: 'anchor-1',
    replies: [
      { author: 'Tom Reeves', timestamp: '1 day ago', text: "Agreed — I'll update the figure once the new threshold is confirmed." },
      { author: 'Jane Smith', timestamp: '20 hours ago', text: "Thanks, let me know once it's in and I'll close this out." }
    ]
  },
  {
    id: 'comment-2',
    author: 'Tom Reeves',
    timestamp: '5 days ago',
    text: 'Can we double check this is still accurate after the scheme review?',
    section: 'section-2',
    anchorId: 'anchor-2'
  },
  {
    id: 'comment-3',
    author: 'Priya Shah',
    timestamp: '1 week ago',
    text: 'Worth adding a worked example here for first-time applicants.',
    section: 'section-3',
    anchorId: 'anchor-3',
    replies: [
      { author: 'Jane Smith', timestamp: '4 days ago', text: 'Good idea — I can draft one based on a typical mixed-tenancy holding.' }
    ]
  }
]

// Replies added through a thread's "Reply" control on editor-experiment.html
// — keyed by comment id (EDITOR_EXPERIMENT_COMMENTS above), so they can be
// merged onto that thread's own sample replies without touching the other
// two comments. Same seed-empty-on-first-read convention as
// getRecentlyOpened/getSavedGuidance above.
function getEditorExperimentReplies (req) {
  if (!req.session.data.editorExperimentReplies) {
    req.session.data.editorExperimentReplies = {}
  }
  return req.session.data.editorExperimentReplies
}

// Comment ids removed via a card's "Delete" control — filtered out of
// EDITOR_EXPERIMENT_COMMENTS below rather than mutating that constant, same
// removed-id-list convention as getRemovedEditingIds elsewhere in this file.
// Deleting a comment also drops any of its own session-persisted replies,
// so a later comment reusing the same id (there isn't one today, but
// nothing stops it) doesn't inherit an orphaned thread.
function getEditorExperimentDeletedCommentIds (req) {
  if (!req.session.data.editorExperimentDeletedCommentIds) {
    req.session.data.editorExperimentDeletedCommentIds = []
  }
  return req.session.data.editorExperimentDeletedCommentIds
}

// Comments created live by selecting editor text and using the floating
// "add comment" icon (editor-experiment.html's pageScripts) — kept
// separate from the fixed EDITOR_EXPERIMENT_COMMENTS array above rather
// than pushed into it, same reasoning as every other session-tracked list
// here (that constant is a shared module-level value, not something a
// request should mutate). Each entry carries enough to both show the
// comment (author/timestamp/text/section/anchorId, same shape as any
// other comment) and restore its anchor span in the editor content on a
// later page load (anchorId/sectionId/selectedText) — see
// buildAddedCommentAnchors below and restoreAddedCommentAnchors in
// pageScripts, which is what actually re-wraps selectedText inside
// section sectionId client-side; nothing server-side injects HTML into
// the editor content itself.
function getEditorExperimentAddedComments (req) {
  if (!req.session.data.editorExperimentAddedComments) {
    req.session.data.editorExperimentAddedComments = []
  }
  return req.session.data.editorExperimentAddedComments
}

function buildEditorExperimentComments (req) {
  const sessionReplies = getEditorExperimentReplies(req)
  const deletedIds = getEditorExperimentDeletedCommentIds(req)
  const seeded = EDITOR_EXPERIMENT_COMMENTS
    .filter((comment) => !deletedIds.includes(comment.id))
    .map((comment) => ({
      ...comment,
      replies: (comment.replies || []).concat(sessionReplies[comment.id] || [])
    }))

  const added = getEditorExperimentAddedComments(req)
    .filter((comment) => !deletedIds.includes(comment.id))
    .map((comment) => ({
      id: comment.id,
      author: comment.author,
      timestamp: comment.timestamp,
      text: comment.text,
      section: comment.sectionId,
      anchorId: comment.anchorId,
      replies: sessionReplies[comment.id] || []
    }))

  return seeded.concat(added)
}

// {anchorId, sectionId, selectedText} for every still-live added comment
// — everything editor-experiment.html's pageScripts needs to re-wrap that
// exact substring inside section sectionId in a fresh app-editor-anchor
// span on page load, the same way the fixed sample's own anchors are
// hand-placed and the real document's are wrapped around a heading (see
// EDITOR_HEADING_ANCHORS above) — this is the third, dynamic source of
// anchors, alongside those two. Deleted comments are already excluded
// (getEditorExperimentAddedComments itself is unfiltered; this reads
// straight from session, same list buildEditorExperimentComments filters
// separately) so a deleted comment's anchor is not resurrected on reload.
function buildAddedCommentAnchors (req) {
  const deletedIds = getEditorExperimentDeletedCommentIds(req)
  return getEditorExperimentAddedComments(req)
    .filter((comment) => !deletedIds.includes(comment.id))
    .map((comment) => ({
      anchorId: comment.anchorId,
      sectionId: comment.sectionId,
      selectedText: comment.selectedText
    }))
}

// Same standalone design experiment as /v2/editor-experiment above, but
// driven by whichever document ?id= names (the destination of "Continue
// editing" on /v5/manage-guidance/document-overview.html) rather than
// always showing the same fixed "SFI 23 Guidance document" sample —
// documentTitle/editorSections, built above, replace the page heading and
// every section in the sidebar/editable content area; the sample Comments/
// Checks in the Changes panel are unaffected; that data is not
// document-specific either before or after this change. A direct visit
// with no ?id=, or one that matches no guidance-documents.js entry, falls
// back to rendering with neither variable set — see the template, which
// then shows the exact same fixed sample content it always has.
router.get('/v5/editor-experiment', (req, res) => {
  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === req.query.id)
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  // Restores in-progress edits when returning via "Back to editor" from the
  // Preview flow (see /v5/editor-experiment/preview below) — only when the
  // stored preview's id still matches the document (or fixed sample, both
  // '') being opened here, so previewing one document and then separately
  // opening a different one does not leak the first one's draft into it.
  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('versions/v5/editor-experiment', { comments, addedCommentAnchorsJson, restoredEditorHtml })
    return
  }

  res.render('versions/v5/editor-experiment', {
    documentTitle: guidanceDocument.title,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
})

// Persists the editor's current live content (including unsaved edits and
// any reordering, since nothing on this page is saved until "Save" — see
// pageScripts there) into req.session.data.editorExperimentPreview, so
// /v5/editor-experiment/preview below can render it. "steps" is already
// split into one entry per Content-nav section by the client
// (buildCustomStepsFromEditor in pageScripts) — see the GET route below for
// how that becomes the same customSteps shape a real guidanceDocuments
// entry's flat steps use. Fire-and-forget from the client, the same way
// reply/delete/add-comment above are.
router.post('/v5/editor-experiment/preview', (req, res) => {
  const steps = Array.isArray(req.body && req.body.steps) ? req.body.steps : []

  req.session.data.editorExperimentPreview = {
    id: (req.body && req.body.id) || '',
    title: (req.body && req.body.title) || '',
    html: (req.body && req.body.html) || '',
    steps: steps.map((step, index) => ({
      sectionNumber: index + 1,
      sectionName: (step && step.sectionName) || '',
      heading: (step && step.heading) || '',
      body: Array.isArray(step && step.body) ? step.body : []
    }))
  }

  res.status(204).end()
})

// Renders the REAL saved-document-view.html customSteps stepper — same
// template/branch a document like cs-ma-land-user-or-land-cover-not-
// compatible-signoff-2026 already uses, not a separate preview layout —
// from the in-progress content captured above rather than from any
// guidance-documents.js entry. stepNumber/currentStep/totalSteps are built
// exactly the way the flat-steps branch of GET /v5/find-guidance/document/
// :id above does; stepLinkBase (see saved-document-view.html) keeps the
// sidebar/Back/Next links generated by that same branch pointed at this
// route (?step=N here) rather than their normal /v5/find-guidance/document/
// :id target, since a live editor draft has no such id to navigate back to.
// A direct visit with nothing captured yet (no preceding POST above) falls
// back to the editor rather than erroring.
router.get('/v5/editor-experiment/preview', (req, res) => {
  const preview = req.session.data.editorExperimentPreview

  if (!preview || !preview.steps.length) {
    res.redirect('/v5/editor-experiment')
    return
  }

  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === preview.id)
  const totalSteps = preview.steps.length
  const requestedStep = parseInt(req.query.step, 10)
  const stepNumber = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

  res.locals.backHref = '/v5/editor-experiment' + (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('versions/v5/saved-document-view', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    version: guidanceDocument ? guidanceDocument.version : 'Version 1',
    documents: genericGuidanceContent,
    customSteps: preview.steps,
    currentStep: preview.steps[stepNumber - 1],
    stepNumber,
    totalSteps,
    stepLinkBase: '/v5/editor-experiment/preview'
  })
})

// Persists a reply added through a thread's "Reply" control on
// editor-experiment.html into req.session.data.editorExperimentReplies, so
// it is still there next time that route is rendered (e.g. after "Save" or
// any other reload) — the client already shows the new reply instantly
// (see pageScripts there), this is fire-and-forget the same way "Save to
// search" on document-overview.html is.
router.post('/v5/editor-experiment/reply', (req, res) => {
  const commentId = req.body && req.body.commentId
  const text = req.body && (req.body.text || '').trim()

  if (commentId && text) {
    const sessionReplies = getEditorExperimentReplies(req)
    if (!sessionReplies[commentId]) sessionReplies[commentId] = []
    sessionReplies[commentId].push({ author: 'You', timestamp: 'Just now', text })
  }

  res.status(204).end()
})

// Removes a comment (and, for a threaded one, its whole thread — replies
// are only ever stored keyed by their parent comment's id, so there is
// nothing else to clean up) via a card's "Delete" control, on either
// editor-experiment.html or its narrow-container duplicate below — see
// getEditorExperimentDeletedCommentIds/buildEditorExperimentComments
// above. Works the same regardless of whether commentId is one of the
// three seeded comments or one created live via the floating "add
// comment" icon (getEditorExperimentAddedComments) — either way it is
// just an id being added to the deleted list, which
// buildEditorExperimentComments/buildAddedCommentAnchors both already
// filter against, so a deleted live comment's anchor is not restored on
// the next reload either. The client already removes the card from the
// page instantly (see pageScripts), this is fire-and-forget the same way
// the reply route above is.
router.post('/v5/editor-experiment/delete', (req, res) => {
  const commentId = req.body && req.body.commentId

  if (commentId) {
    const deletedIds = getEditorExperimentDeletedCommentIds(req)
    if (!deletedIds.includes(commentId)) deletedIds.push(commentId)
    delete getEditorExperimentReplies(req)[commentId]
  }

  res.status(204).end()
})

// Persists a comment created live by selecting editor text and using the
// floating "add comment" icon (editor-experiment.html's pageScripts) into
// req.session.data.editorExperimentAddedComments — see
// getEditorExperimentAddedComments above. text/sectionId/selectedText are
// all required: sectionId + selectedText are what
// buildAddedCommentAnchors uses to tell the client which substring to
// re-wrap in an app-editor-anchor span inside which section on a later
// page load (restoreAddedCommentAnchors, pageScripts) — a request missing
// any of them is silently ignored rather than creating a comment with no
// way to find its own anchor again after a reload. commentId/anchorId are
// both generated client-side (see pageScripts) and simply trusted here,
// the same way a reply's author is always just "You" — this is
// session-local mock data, not real multi-user content.
router.post('/v5/editor-experiment/add-comment', (req, res) => {
  const commentId = req.body && req.body.commentId
  const anchorId = req.body && req.body.anchorId
  const sectionId = req.body && req.body.sectionId
  const text = req.body && (req.body.text || '').trim()
  const selectedText = req.body && req.body.selectedText

  if (commentId && anchorId && sectionId && text && selectedText) {
    getEditorExperimentAddedComments(req).push({
      id: commentId,
      author: 'You',
      timestamp: 'Just now',
      text,
      sectionId,
      anchorId,
      selectedText
    })
  }

  res.status(204).end()
})

// Narrow-container comparison duplicate of the route above — same
// documentTitle/editorSections/comments/addedCommentAnchorsJson data
// (including editorExperimentReplies/editorExperimentAddedComments
// persistence — a reply or a newly-added comment made on either page
// lands in the same session buckets, since none of this is page-specific),
// rendering versions/v5/manage-guidance/editor-experiment-narrow instead.
// Not linked from anywhere in the UI; reached only by visiting this URL
// directly.
router.get('/v5/manage-guidance/editor-experiment-narrow', (req, res) => {
  const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === req.query.id)
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('versions/v5/manage-guidance/editor-experiment-narrow', { comments, addedCommentAnchorsJson, restoredEditorHtml })
    return
  }

  res.render('versions/v5/manage-guidance/editor-experiment-narrow', {
    documentTitle: guidanceDocument.title,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
})
