//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const prototypes = require('../../lib/prototypes')
const { getPageNotes } = require('../../lib/page-notes')
const library = require('../../data/documents')
const { guidedSearches } = require('../../data/guided-searches')
const { favouritedGuidance } = require('../../data/favourited-guidance')
const { savedDocuments } = require('../../data/saved-documents')
const { searchResults } = require('../../data/search-results')
const { guidanceDocuments } = require('../../data/guidance-documents')
// v5 only — the generic 3-phase placeholder content saved-document-view.html
// and editor-experiment.html both fall back to for a guidanceDocuments entry
// with no "steps" of its own. See the comment at the top of that file.
const {
  documents: genericGuidanceContent
} = require('../../data/generic-guidance-content')
const sampleDocument = require('../../data/sample-document')
const v4SampleDocument = require('../../data/v4-sample-document')
// Shared with the browser — see the scripts block in app/views/layouts/main.html.
const qualityChecks = require('../../assets/javascripts/quality-checks')

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

// The Notes panel (app/views/partials/notes-panel.njk) reads this on every
// page, whichever version it belongs to. See app/lib/page-notes.js.
router.use((req, res, next) => {
  res.locals.pageNotes = getPageNotes(req.path)
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
  {
    text: 'Find guidance',
    href: '/v5/find-guidance',
    prefixes: ['/v5/find-guidance', '/v5/document-overview']
  },
  {
    text: 'Manage guidance',
    href: '/v5/all-guidance-docs',
    prefixes: [
      '/v5/all-guidance-docs',
      '/v5/guidance-document',
      '/v5/manage-guidance'
    ]
  }
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
  } else if (req.path.startsWith('/v6/')) {
    res.locals.isV6 = true

    if (req.path === '/v6/sign-in') {
      res.locals.isV6SignIn = true
    } else if (req.path === '/v6/unified-guidance') {
      // The only v6 page with the taller "home header" (isV6Home,
      // defra-header.njk) — no `navigation` set here, since the sidebar on
      // that page itself is the navigation now (see
      // app/views/v6/unified-guidance/page.njk), not a tabs list in the
      // header. Every other v6 page shows neither: a govukBreadcrumbs
      // component in its own content takes over as its wayfinding instead
      // (see each template).
      res.locals.isV6Home = true
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
    href:
      fixVariant === 'editor'
        ? `/designer/documents/edit?line=${issue.line}`
        : `/designer/documents/findings/${issue.id}`
  }))

  const outstanding = issues.filter((issue) => !issue.verdict)
  const resolved = issues.filter((issue) => issue.verdict)

  // Counted here rather than in the template: Nunjucks has no dictionary update
  // method, so tallying in a loop is Jinja2 syntax that quietly fails here.
  const verdictCounts = Object.keys(VERDICTS).reduce((counts, verdict) => {
    counts[verdict] = resolved.filter(
      (issue) => issue.verdict === verdict
    ).length
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
// the multi-version/journey browser it originally was. Generated from
// app/data/prototypes.js again (via app/lib/prototypes.js's getVersions()),
// same as the original browser was, rather than the hand-written HTML this
// became for a while — see that file's own header comment.
router.get('/', (req, res) => {
  res.render('index', { versions: prototypes.getVersions() })
})

// The entry point for the whole /v2/ prototype, before /v2/start — the
// versions list's own "Version 2 (current)" link now points here instead of
// straight to /v2/start (see app/views/index.html). /v2/start itself is
// still a real route below and stays reachable directly; this is just the
// intended front door now, not a lock on the old one.
router.get('/v2/sign-in', (req, res) => {
  res.render('versions/v2/sign-in')
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
  res.render('versions/v2/start')
})

// Session-backed "Recently opened"/"Saved guidance" list helpers
// (getRecentlyOpened, getSavedGuidance, getListForTab, addRecentlyOpened,
// addSavedGuidance, formatToday, buildFindGuidanceRows) moved to
// app/data/guidance-lists.js — shared, unmodified, by v2's /find-guidance
// routes below and the /v5/find-guidance page module
// (app/views/v5/find-guidance/).
const guidanceLists = require('../../data/guidance-lists')

// Not designed yet — a placeholder so "Find and locate guidance" leads
// somewhere rather than a 404. See app/views/find-guidance.html.
//
// Both tabs' rows are built from the session-backed lists above — see
// buildFindGuidanceRows — rather than from res.locals.guidedSearches/
// favouritedGuidance (still set above, for other pages) — those two files
// predate guidance-documents.js and do not have the version field this
// page's rows now need.
router.get('/v2/find-guidance', (req, res) => {
  // No backHref — find-guidance.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const recentlyOpenedDocuments = guidanceLists.buildFindGuidanceRows(
    guidanceLists.getRecentlyOpened(req)
  )
  const savedGuidanceDocuments = guidanceLists.buildFindGuidanceRows(
    guidanceLists.getSavedGuidance(req)
  )

  res.render('versions/v2/find-guidance', {
    recentlyOpenedDocuments,
    savedGuidanceDocuments
  })
})

// "Start a new search" — neither journey off it is designed yet, so both are
// placeholders. See app/views/find-guidance-new.html.
router.get('/v2/find-guidance/new', (req, res) => {
  res.locals.backHref = '/v2/find-guidance'
  res.render('versions/v2/find-guidance-new')
})

router.post('/v2/find-guidance/new', (req, res) => {
  res.redirect(
    req.body.searchMethod === 'ai'
      ? '/v2/find-guidance/ai-search'
      : '/v2/find-guidance/organic-search'
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
// Moved to app/data/guidance-lists.js — shared, unmodified, by v2's routes
// below, v5's (also below) and v6's (app/views/v6/find-guidance/).
const { REMOVE_CONFIRM_TABS } = guidanceLists

router.get('/v2/find-guidance/remove-confirm', (req, res) => {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const tab = REMOVE_CONFIRM_TABS[req.query.tab]

  res.locals.backHref = '/v2/find-guidance'
  res.render('versions/v2/delete-search-confirm', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: tab ? tab.listName : null,
    returnHref: tab ? '/v2/find-guidance#' + tab.anchor : '/v2/find-guidance'
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
router.post('/v2/find-guidance/remove', (req, res) => {
  const tab = REMOVE_CONFIRM_TABS[req.body.tab]
  const list = guidanceLists.getListForTab(req, req.body.tab)

  if (list && req.body.id) {
    const index = list.findIndex((entry) => entry.id === req.body.id)
    if (index !== -1) list.splice(index, 1)
  }

  res.redirect(tab ? '/v2/find-guidance#' + tab.anchor : '/v2/find-guidance')
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
router.get('/v2/find-guidance/document/:id', (req, res) => {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref =
    '/v2/document-overview/' +
    req.params.id +
    (req.query.from ? '?from=' + req.query.from : '')

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : legacyDocument
      ? legacyDocument.name
      : guidanceDocuments[0].title
  // Legacy savedDocuments/searchResults entries have a status, not a
  // version — every id that matters here is also in guidanceDocuments
  // though (see the comment above), so this only ever falls back to
  // guidanceDocuments[0].version for a genuinely unmatched id.
  const version = guidanceDocument
    ? guidanceDocument.version
    : guidanceDocuments[0].version

  // Tracks this as a "recently opened" document — but only on the actual
  // entry into it (the "Open" button on document-overview.html links here
  // with no ?step=), not on every subsequent Back/Next/sidebar/dropdown/
  // search navigation between its own steps, which all stay on this same
  // route with a ?step= of their own. A legacy savedDocuments/searchResults
  // id with no guidanceDocuments match is never tracked, since
  // buildFindGuidanceRows (see the /find-guidance route above) would just
  // skip it anyway.
  if (guidanceDocument && !req.query.step) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
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
      const stepNumber =
        requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

      res.render('versions/v2/saved-document-view', {
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
    const stepNumber =
      requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

    res.render('versions/v2/saved-document-view', {
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

  res.render('versions/v2/saved-document-view', {
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
router.get('/v2/find-guidance/organic-search', (req, res) => {
  // No backHref — organic-search.html shows breadcrumbs instead of a Back
  // link now (see the template).
  const organicSearchResults = guidanceDocuments.filter(
    (document) => document.showOnOrganicSearch
  )

  res.render('versions/v2/organic-search', {
    results: organicSearchResults,
    resultsJson: JSON.stringify(
      organicSearchResults.map((document) => ({
        id: document.id,
        title: document.title,
        description: document.description,
        version: document.version,
        lastUpdated: document.lastUpdated,
        published: document.published,
        category: document.category,
        scheme: document.scheme,
        year: document.year
      }))
    )
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
router.get('/v2/document-overview/:id', (req, res) => {
  const document =
    guidanceDocuments.find((candidate) => candidate.id === req.params.id) ||
    guidanceDocuments[0]

  // No backHref — document-overview.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v2/document-overview', {
    document,
    from: req.query.from,
    defaultVersionKey:
      document.version === 'Version 1' ? 'version1' : 'version2',
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
router.post('/v2/find-guidance/save-to-search', (req, res) => {
  if (req.body && req.body.id) {
    guidanceLists.addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
})

// Search by explaining the problem, rather than by document. See
// app/views/ai-search.html.
router.get('/v2/find-guidance/ai-search', (req, res) => {
  res.locals.backHref = '/v2/find-guidance/new'
  res.render('versions/v2/ai-search')
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
router.post('/v2/find-guidance/ai-search-loading', (req, res) => {
  req.session.data.aiSearchQuery = (req.body.query || '').trim()
  res.redirect('/v2/find-guidance/ai-search-loading')
})

router.get('/v2/find-guidance/ai-search-loading', (req, res) => {
  res.render('versions/v2/ai-search-loading')
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

function renderAiSearchResults(req, res) {
  const search = guidedSearches.find(
    (candidate) => candidate.id === req.params.id
  )
  const id = search ? search.id : 'new'
  const totalSteps = search ? search.totalSteps : DEFAULT_TOTAL_STEPS
  const startingStep = search ? search.resumeStep : DEFAULT_STEP

  const step = Math.min(
    Math.max(Number(req.params.step) || startingStep, 1),
    totalSteps
  )

  res.render('versions/v2/ai-search-results', {
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
        ? `/v2/find-guidance/ai-search-results/${id}/${step - 1}`
        : search
          ? '/v2/find-guidance'
          : '/v2/find-guidance/ai-search',
    // Drives the govukBackLink at the top instead — the saved-searches list,
    // not a step. See the comment on resolvedBackHref in layouts/main.html.
    backLinkHref: '/v2/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps
        ? `/v2/find-guidance/ai-search-results/${id}/${step + 1}`
        : '/v2/find-guidance'
  })
}

router.get('/v2/find-guidance/ai-search-results', renderAiSearchResults)
router.get('/v2/find-guidance/ai-search-results/:id', renderAiSearchResults)
router.get(
  '/v2/find-guidance/ai-search-results/:id/:step',
  renderAiSearchResults
)

// -- Stepping through the findings one at a time ---------------------------
//
// A sub-journey off the quality issues page. Each finding gets a page of its
// own with the rule it came from, where it is, why it matters and what to do —
// and a verdict, so a designer can dispose of a finding they disagree with
// rather than being stuck with it.

function findingOr404(req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue)
    res.status(404).render('versions/v2/designer/documents/finding-not-found')
  return issue
}

router.get('/v2/designer/documents/findings/:id', (req, res) => {
  const issue = findingOr404(req, res)
  if (!issue) return

  const { issues } = res.locals.document
  const position = issues.indexOf(issue)

  res.render('versions/v2/designer/documents/finding', {
    finding: issue,
    position: position + 1,
    total: issues.length,
    previousFinding: issues[position - 1],
    nextFinding: issues[position + 1]
  })
})

router.post('/v2/designer/documents/findings/:id', (req, res) => {
  const issue = findingOr404(req, res)
  if (!issue) return

  // Only a verdict the service knows about. Anything else is dropped rather
  // than stored, which keeps the summary counts and the tag lookup honest.
  if (!Object.prototype.hasOwnProperty.call(VERDICTS, req.body.verdict)) {
    return res.redirect(`/v2/designer/documents/findings/${issue.id}`)
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
      ? `/v2/designer/documents/findings/${next.id}`
      : '/v2/designer/documents/review-complete'
  )
})

// Start the sub-journey at the first finding with no verdict yet.
router.get('/v2/designer/documents/findings', (req, res) => {
  const next = res.locals.document.outstanding[0]
  res.redirect(
    next
      ? `/v2/designer/documents/findings/${next.id}`
      : '/v2/designer/documents/review-complete'
  )
})

// Clears recorded verdicts, so a session can be run again from the index.
router.get('/v2/designer/documents/review-reset', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/v2/designer/documents/issues')
})

// All guidance documents in the hub, tabbed by status. See
// app/views/all-guidance-docs.html.
router.get('/v2/all-guidance-docs', (req, res) => {
  // No backHref — all-guidance-docs.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v2/all-guidance-docs')
})

// "Create guidance" on all-guidance-docs.html — which of three ways in.
// See app/views/create-guidance.html.
router.get('/v2/create-guidance', (req, res) => {
  res.locals.backHref = '/v2/all-guidance-docs'
  res.render('versions/v2/create-guidance')
})

router.post('/v2/create-guidance', (req, res) => {
  if (req.body.createGuidance === 'create-new') {
    return res.redirect('/v2/designer/migrate/single/new-guide-purpose')
  }

  if (req.body.createGuidance === 'update-existing') {
    return res.redirect('/v2/designer/update-existing-guide')
  }

  // "Upload guidance" — captures metadata first, then continues into the
  // existing upload flow. See app/views/designer/migrate/single/metadata.html.
  res.redirect('/v2/designer/migrate/single/metadata')
})

// A single guidance document's overview. Placeholder until the content panel
// is designed — see app/views/guidance-document.html.
router.get('/v2/guidance-document/:id', (req, res) => {
  // No backHref — guidance-document.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v2/guidance-document')
})

// Matches the slug all-guidance-docs.html builds for each Recently added
// row's Edit link (document.name | lower | replace(":", "") | replace(" ", "-")),
// so the id in the URL can be traced back to which row was actually clicked.
function slugify(name) {
  return name.toLowerCase().replace(/:/g, '').replace(/ /g, '-')
}

// Straight into the markdown editor for a document, from the "Edit" button
// on a Recently added row — :id is only ever used to build this href
// (per-row, from the document's name, see all-guidance-docs.html). There is
// no per-document markdown yet, so every route into the editor still shares
// the one placeholder document/text — but the heading itself should match
// whichever row was clicked, so the id is matched back to its row here.
// See app/views/guidance-document-edit.html.
router.get('/v2/guidance-document/:id/edit', (req, res) => {
  const uploaded = library.batch.find(
    (document) => slugify(document.name) === req.params.id
  )

  res.locals.backHref = '/v2/all-guidance-docs'
  res.render('versions/v2/guidance-document-edit', {
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

function renderChangeReview(req, res) {
  const id = req.params.id
  const issueNumber = Math.min(
    Math.max(Number(req.params.issueNumber) || 1, 1),
    TOTAL_REVIEW_ISSUES
  )

  res.locals.backHref = `/v2/guidance-document/${id}`

  res.render('versions/v2/change-review', {
    issueNumber,
    totalIssues: TOTAL_REVIEW_ISSUES,
    previousIssueHref:
      issueNumber > 1
        ? `/v2/guidance-document/${id}/review/${issueNumber - 1}`
        : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES
        ? `/v2/guidance-document/${id}/review/${issueNumber + 1}`
        : null
  })
}

router.get('/v2/guidance-document/:id/review', renderChangeReview)
router.get('/v2/guidance-document/:id/review/:issueNumber', renderChangeReview)

// Captures a bit of context about the guidance before the existing upload
// flow starts — inserted between "Upload guidance" on create-guidance.html
// and the upload screen below. See
// app/views/designer/migrate/single/metadata.html.
router.get('/v2/designer/migrate/single/metadata', (req, res) => {
  res.render('versions/v2/designer/migrate/single/metadata')
})

router.post('/v2/designer/migrate/single/metadata', (req, res) => {
  req.session.data.guidanceType = req.body.guidanceType
  req.session.data.guidanceTitle = (req.body.guidanceTitle || '').trim()
  req.session.data.guidanceAudience = (req.body.guidanceAudience || '').trim()
  req.session.data.guidanceGoal = (req.body.guidanceGoal || '').trim()
  req.session.data.guidanceRequirements = (
    req.body.guidanceRequirements || ''
  ).trim()
  req.session.data.guidanceSystemAccess = req.body.systemAccess

  res.redirect(res.locals.migrateHref)
})

// Overrides just the back link on this one step of the migrate journey — it
// otherwise comes from prototypes.findStep() via the router.use() above,
// which would send it back to the dashboard. Nothing else about the step
// (journey banner, nextHref) changes, since that middleware still runs
// first and sets everything else as normal.
router.get('/v2/designer/migrate/single/upload', (req, res) => {
  res.locals.backHref = '/v2/designer/migrate/single/metadata'
  res.render('versions/v2/designer/migrate/single/upload')
})

// Inserted between Upload a Word document and Checking your file — a
// "Step X of 2" sequence local to these two pages, kept separate from the
// journey banner and step count in app/data/prototypes.js, which is
// otherwise unchanged.
router.get('/v2/designer/migrate/single/document-purpose', (req, res) => {
  res.locals.backHref = '/v2/designer/migrate/single/upload'
  res.render('versions/v2/designer/migrate/single/document-purpose')
})

// Saves the document title and purpose to the session — nothing reads them
// back yet, but they are captured in case a later step needs them — then
// continues to Checking your file, same as before this page asked anything.
router.post('/v2/designer/migrate/single/document-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/v2/designer/migrate/single/uploading')
})

// "Create a new guide" on create-guidance.html — the same title/purpose
// fields as document-purpose.html above, but with no file to check
// afterwards, so this opens the markdown editor directly instead of
// Checking your file.
router.get('/v2/designer/migrate/single/new-guide-purpose', (req, res) => {
  res.locals.backHref = '/v2/create-guidance'
  res.render('versions/v2/designer/migrate/single/new-guide-purpose')
})

router.post('/v2/designer/migrate/single/new-guide-purpose', (req, res) => {
  req.session.data.documentTitle = (req.body.documentTitle || '').trim()
  req.session.data.documentPurpose = (req.body.purpose || '').trim()

  res.redirect('/v2/designer/documents/edit')
})

// "Update existing guide" on create-guidance.html — not designed yet. See
// app/views/designer/update-existing-guide.html.
router.get('/v2/designer/update-existing-guide', (req, res) => {
  res.locals.backHref = '/v2/create-guidance'
  res.render('versions/v2/designer/update-existing-guide')
})

// These pages had no explicit route before — the kit served them by matching
// the URL directly to a template file at the same path (e.g. /designer/dashboard
// to app/views/designer/dashboard.html). Now that the templates live under
// app/views/versions/v2/, the URL and the template path no longer match, so
// each one needs an explicit route to keep working.
const V2_DIRECT_PAGES = [
  '/v2/designer/dashboard',
  '/v2/designer/documents',
  '/v2/designer/documents/edit',
  '/v2/designer/documents/issues',
  '/v2/designer/documents/preview',
  '/v2/designer/documents/review-complete',
  '/v2/designer/sign-in',
  '/v2/designer/migrate/single/check',
  '/v2/designer/migrate/single/confirmation',
  '/v2/designer/migrate/single/rejected',
  '/v2/designer/migrate/single/uploading',
  '/v2/designer/migrate/multiple/check',
  '/v2/designer/migrate/multiple/confirmation',
  '/v2/designer/migrate/multiple/documents',
  '/v2/designer/migrate/multiple/queue',
  '/v2/designer/migrate/multiple/upload',
  '/v2/designer/migrate/multiple/uploading'
]

V2_DIRECT_PAGES.forEach((urlPath) => {
  router.get(urlPath, (req, res) => {
    res.render('versions/v2' + urlPath.replace('/v2', ''))
  })
})

// Old unprefixed URLs — kept working with a redirect to their /v2/ equivalent
// rather than removed, since prototypes get shared as links in research plans
// and Slack. GET redirects are permanent (301); POST redirects use 308 so the
// method and body survive the redirect, unlike 301/302.
const V2_GET_REDIRECTS = [
  '/find-guidance',
  '/find-guidance/new',
  '/find-guidance/remove-confirm',
  '/find-guidance/document/:id',
  '/find-guidance/organic-search',
  '/find-guidance/ai-search',
  '/find-guidance/ai-search-loading',
  '/find-guidance/ai-search-results',
  '/find-guidance/ai-search-results/:id',
  '/find-guidance/ai-search-results/:id/:step',
  '/document-overview/:id',
  '/all-guidance-docs',
  '/create-guidance',
  '/guidance-document/:id',
  '/guidance-document/:id/edit',
  '/guidance-document/:id/review',
  '/guidance-document/:id/review/:issueNumber',
  '/designer/documents/findings/:id',
  '/designer/documents/findings',
  '/designer/documents/review-reset',
  '/designer/migrate/single/metadata',
  '/designer/migrate/single/upload',
  '/designer/migrate/single/document-purpose',
  '/designer/migrate/single/new-guide-purpose',
  '/designer/update-existing-guide',
  ...V2_DIRECT_PAGES.map((urlPath) => urlPath.replace('/v2', ''))
]

const V2_POST_REDIRECTS = [
  '/find-guidance/new',
  '/find-guidance/remove',
  '/find-guidance/save-to-search',
  '/find-guidance/ai-search-loading',
  '/create-guidance',
  '/designer/documents/findings/:id',
  '/designer/migrate/single/metadata',
  '/designer/migrate/single/document-purpose',
  '/designer/migrate/single/new-guide-purpose'
]

V2_GET_REDIRECTS.forEach((urlPath) => {
  router.get(urlPath, (req, res) => {
    const target = urlPath.replace(/:(\w+)/g, (match, name) => req.params[name])
    res.redirect(301, '/v2' + target)
  })
})

V2_POST_REDIRECTS.forEach((urlPath) => {
  router.post(urlPath, (req, res) => {
    const target = urlPath.replace(/:(\w+)/g, (match, name) => req.params[name])
    res.redirect(308, '/v2' + target)
  })
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
function v1JourneyHrefs(req, livePath) {
  const location = prototypes.findStep(livePath, req.session.data.activeJourney)
  return {
    backHref:
      location && location.previous
        ? '/v1' + location.previous.path
        : undefined,
    nextHref: location && location.next ? '/v1' + location.next.path : undefined
  }
}

router.get('/v1/', (req, res) => {
  delete req.session.data.activeJourney
  res.render('versions/v1/start')
})

router.post('/v1/', (req, res) => {
  res.redirect(
    req.body.destination === 'find'
      ? '/v1/find-guidance'
      : '/v1/all-guidance-docs'
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
    req.body.searchMethod === 'ai'
      ? '/v1/find-guidance/ai-search'
      : '/v1/find-guidance/organic-search'
  )
})

router.get('/v1/find-guidance/delete/:id', (req, res) => {
  const search = guidedSearches.find(
    (candidate) => candidate.id === req.params.id
  )

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

function renderV1AiSearchResults(req, res) {
  const search = guidedSearches.find(
    (candidate) => candidate.id === req.params.id
  )
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
        : search
          ? '/v1/find-guidance'
          : '/v1/find-guidance/ai-search',
    backLinkHref: '/v1/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps
        ? `/v1/find-guidance/ai-search-results/${id}/${step + 1}`
        : '/v1/find-guidance'
  })
}

router.get('/v1/find-guidance/ai-search-results', renderV1AiSearchResults)
router.get('/v1/find-guidance/ai-search-results/:id', renderV1AiSearchResults)
router.get(
  '/v1/find-guidance/ai-search-results/:id/:step',
  renderV1AiSearchResults
)

function v1FindingOr404(req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue)
    res.status(404).render('versions/v1/designer/documents/finding-not-found')
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

function renderV1ChangeReview(req, res) {
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
      issueNumber > 1
        ? `/v1/guidance-document/${id}/review/${issueNumber - 1}`
        : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES
        ? `/v1/guidance-document/${id}/review/${issueNumber + 1}`
        : null
  })
}

router.get('/v1/guidance-document/:id/review', renderV1ChangeReview)
router.get(
  '/v1/guidance-document/:id/review/:issueNumber',
  renderV1ChangeReview
)

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
  Object.assign(
    res.locals,
    v1JourneyHrefs(req, '/designer/migrate/single/uploading')
  )
  res.render('versions/v1/designer/migrate/single/uploading')
})

router.get('/v1/designer/migrate/single/check', (req, res) => {
  Object.assign(
    res.locals,
    v1JourneyHrefs(req, '/designer/migrate/single/check')
  )
  res.render('versions/v1/designer/migrate/single/check')
})

router.get('/v1/designer/migrate/single/confirmation', (req, res) => {
  Object.assign(
    res.locals,
    v1JourneyHrefs(req, '/designer/migrate/single/confirmation')
  )
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
    important: res.locals.document.split.important.map((issue) =>
      byId.get(issue.id)
    ),
    suggestions: res.locals.document.split.suggestions.map((issue) =>
      byId.get(issue.id)
    )
  }

  res.render('versions/v1/designer/documents/issues', {
    document: { ...res.locals.document, issues: v1Issues, split: v1Split },
    editorHref: '/v1/designer/documents/edit',
    stepThroughHref: '/v1/designer/documents/findings',
    fixHref: res.locals.fixHref
      ? '/v1' + res.locals.fixHref
      : res.locals.fixHref
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
function toV3Selections(value, allowed) {
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
    selections[group] = toV3Selections(
      req.query[group],
      V3_FILTER_GROUPS[group]
    )
  })

  const buildHref = (without) => {
    const params = new URLSearchParams()
    if (searched) params.set('search', req.query.search)
    Object.entries(selections).forEach(([group, values]) => {
      values.forEach((value) => {
        if (without && without.group === group && without.value === value)
          return
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
function v3StarterMarkdown(title) {
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
function v3EditorFindings(markdown) {
  return qualityChecks
    .findIssues(markdown)
    .filter(
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

function v3VersionMarkdown(versionId) {
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
  const guide = searchResults.find(
    (candidate) => candidate.id === req.params.id
  )
  const draft = library.documents.find(
    (document) => slugify(document.name) === req.params.id
  )
  const uploaded =
    req.params.id === 'uploaded' ? req.session.data.v3UploadedGuide : null
  const created = req.params.id === 'new' ? req.session.data.v3NewGuide : null

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
    quote:
      'The customer must supply evidence for each option they have applied for'
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

  const guide = searchResults.find(
    (candidate) => candidate.id === req.params.id
  )
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
  {
    name: 'Applying for the Sustainable Farming Incentive',
    status: 'Draft',
    scheme: 'Sustainable Farming Incentive',
    issues: 31,
    comments: 2,
    lastEdited: '24 August 2026'
  },
  {
    name: 'How inspections work',
    status: 'Pending',
    scheme: 'Cross Compliance',
    issues: 12,
    comments: 3,
    lastEdited: '21 August 2026'
  },
  {
    name: 'Cross compliance rules',
    status: 'Approved',
    scheme: 'Cross Compliance',
    issues: 22,
    comments: 1,
    lastEdited: '18 August 2026'
  },
  {
    name: 'Woodland creation: eligibility',
    status: 'Published',
    scheme: 'Countryside Stewardship',
    issues: 14,
    comments: 0,
    lastEdited: '11 August 2026'
  },
  {
    name: 'Payment deadlines and what to expect',
    status: 'Removed',
    scheme: 'Basic Payment Scheme',
    issues: 8,
    comments: 4,
    lastEdited: '2 August 2026'
  }
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
  const result = searchResults.find(
    (candidate) => candidate.id === req.params.id
  )
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
  res.render('versions/v2/editor-experiment')
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

// GET /v5/find-guidance itself now lives in its own page module — see
// app/views/v5/find-guidance/.

router.get('/v5/find-guidance/new', (req, res) => {
  res.locals.backHref = '/v5/find-guidance'
  res.render('versions/v5/find-guidance-new')
})

router.post('/v5/find-guidance/new', (req, res) => {
  res.redirect(
    req.body.searchMethod === 'ai'
      ? '/v5/find-guidance/ai-search'
      : '/v5/find-guidance/organic-search'
  )
})

router.get('/v5/find-guidance/remove-confirm', (req, res) => {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
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
  const list = guidanceLists.getListForTab(req, req.body.tab)

  if (list && req.body.id) {
    const index = list.findIndex((entry) => entry.id === req.body.id)
    if (index !== -1) list.splice(index, 1)
  }

  res.redirect(tab ? '/v5/find-guidance#' + tab.anchor : '/v5/find-guidance')
})

router.get('/v5/find-guidance/document/:id', (req, res) => {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  res.locals.backHref =
    '/v5/document-overview/' +
    req.params.id +
    (req.query.from ? '?from=' + req.query.from : '')

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : legacyDocument
      ? legacyDocument.name
      : guidanceDocuments[0].title
  const version = guidanceDocument
    ? guidanceDocument.version
    : guidanceDocuments[0].version

  if (guidanceDocument && !req.query.step) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
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
      const stepNumber =
        requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

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
    const stepNumber =
      requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

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
  const organicSearchResults = guidanceDocuments.filter(
    (document) => document.showOnOrganicSearch
  )

  res.render('versions/v5/organic-search', {
    results: organicSearchResults,
    // Pre-fills and immediately applies the search box on find-guidance.html
    // (?q=, a plain GET <form> there — see that template) — the template's
    // own script reads this same value back off the pre-filled input rather
    // than this being passed to it directly, so a direct visit with no q
    // behaves exactly as before (empty string, nothing pre-applied).
    initialSearchQuery: (req.query.q || '').trim(),
    resultsJson: JSON.stringify(
      organicSearchResults.map((document) => ({
        id: document.id,
        title: document.title,
        description: document.description,
        version: document.version,
        lastUpdated: document.lastUpdated,
        published: document.published,
        category: document.category,
        scheme: document.scheme,
        year: document.year
      }))
    )
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
    defaultVersionKey:
      document.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(document.versions)
  })
})

router.post('/v5/find-guidance/save-to-search', (req, res) => {
  if (req.body && req.body.id) {
    guidanceLists.addSavedGuidance(req, req.body.id)
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

function renderV5AiSearchResults(req, res) {
  const search = guidedSearches.find(
    (candidate) => candidate.id === req.params.id
  )
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
        : search
          ? '/v5/find-guidance'
          : '/v5/find-guidance/ai-search',
    backLinkHref: '/v5/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps
        ? `/v5/find-guidance/ai-search-results/${id}/${step + 1}`
        : '/v5/find-guidance'
  })
}

router.get('/v5/find-guidance/ai-search-results', renderV5AiSearchResults)
router.get('/v5/find-guidance/ai-search-results/:id', renderV5AiSearchResults)
router.get(
  '/v5/find-guidance/ai-search-results/:id/:step',
  renderV5AiSearchResults
)

// Manage guidance (v5 only) — the "Editing"/"Awaiting approval" rows shared
// by GET /v5/all-guidance-docs below, its search results page (GET
// /v5/manage-guidance-search) and its document overview page (GET
// /v5/manage-guidance/document-overview), plus the sample "Published"
// documents and session-backed added/removed id lists behind them. Moved to
// app/data/manage-guidance.js — shared, unmodified, by v5's routes below and
// v6's (app/views/v6/all-guidance-docs/, app/views/v6/manage-guidance/).
const {
  getRemovedEditingIds,
  getAddedEditingIds,
  buildManageGuidanceRows,
  MANAGE_GUIDANCE_PUBLISHED_SAMPLES,
  buildManageGuidanceSearchResults
} = require('../../data/manage-guidance')

router.get('/v5/all-guidance-docs', (req, res) => {
  // No backHref — all-guidance-docs.html shows breadcrumbs instead of a
  // Back link now (see the template).
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  res.render('versions/v5/all-guidance-docs', {
    editingDocuments,
    awaitingApprovalDocuments
  })
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
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)
  const allDocuments = editingDocuments.concat(awaitingApprovalDocuments)

  const results = query
    ? allDocuments.filter((document) =>
        document.name.toLowerCase().includes(query.toLowerCase())
      )
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
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  const editingMatch = editingDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const awaitingApprovalMatch = awaitingApprovalDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  // No backHref on either render below — the template shows a breadcrumb
  // back to Manage guidance instead of a Back link.
  if (editingMatch || awaitingApprovalMatch) {
    res.render('versions/v5/manage-guidance/document-overview', {
      document: editingMatch || awaitingApprovalMatch,
      status: editingMatch ? 'Editing' : 'Awaiting approval'
    })
    return
  }

  const publishedMatch = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find(
    (candidate) => candidate.id === req.query.id
  )

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

  res.redirect(
    '/v5/editor-experiment?id=' + encodeURIComponent(req.body.id || '')
  )
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
  const document = editingDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

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
  const searchResults = buildManageGuidanceSearchResults(
    req,
    '/v5/manage-guidance/document-overview'
  )

  res.render('versions/v5/manage-guidance/search-guidance', {
    results: searchResults,
    initialSearchQuery: (req.query.q || '').trim(),
    resultsJson: JSON.stringify(
      searchResults.map((document) => ({
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
      }))
    )
  })
})

router.get('/v5/guidance-document/:id', (req, res) => {
  // No backHref — guidance-document.html shows breadcrumbs instead of a
  // Back link now (see the template).
  res.render('versions/v5/guidance-document')
})

router.get('/v5/guidance-document/:id/edit', (req, res) => {
  const uploaded = library.batch.find(
    (document) => slugify(document.name) === req.params.id
  )

  res.locals.backHref = '/v5/all-guidance-docs'
  res.render('versions/v5/guidance-document-edit', {
    documentName: uploaded ? uploaded.name : library.current.name,
    documentPages: uploaded ? uploaded.pages : library.current.pages
  })
})

function renderV5ChangeReview(req, res) {
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
      issueNumber > 1
        ? `/v5/guidance-document/${id}/review/${issueNumber - 1}`
        : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES
        ? `/v5/guidance-document/${id}/review/${issueNumber + 1}`
        : null
  })
}

router.get('/v5/guidance-document/:id/review', renderV5ChangeReview)
router.get(
  '/v5/guidance-document/:id/review/:issueNumber',
  renderV5ChangeReview
)

// editor-experiment.html's data — the sidebar/content sections built from
// a guidanceDocument (buildEditorSections), the sample Comments/Checks in
// the Changes panel, and the session-backed replies/deletions/added
// comments accumulated against them. Moved to app/data/editor-experiment.js
// — shared, unmodified, by v5's routes below and v6's
// (app/views/v6/editor-experiment/).
const {
  buildEditorSections,
  getEditorExperimentReplies,
  getEditorExperimentDeletedCommentIds,
  getEditorExperimentAddedComments,
  buildEditorExperimentComments,
  buildAddedCommentAnchors
} = require('../../data/editor-experiment')

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
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
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
    res.render('versions/v5/editor-experiment', {
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
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

  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === preview.id
  )
  const totalSteps = preview.steps.length
  const requestedStep = parseInt(req.query.step, 10)
  const stepNumber =
    requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

  res.locals.backHref =
    '/v5/editor-experiment' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
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
    sessionReplies[commentId].push({
      author: 'You',
      timestamp: 'Just now',
      text
    })
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
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('versions/v5/manage-guidance/editor-experiment-narrow', {
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
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
// check page. Scheme, audience and systems are all many-of (checkboxes) -
// guidance can relate to more than one scheme, so scheme moved from a single
// radio choice to checkboxes alongside them. Labels include the acronym
// commonly used for that scheme, where there is one.
const V4_SCHEMES = {
  sfi: 'Sustainable Farming Incentive (SFI)',
  'countryside-stewardship': 'Countryside Stewardship (CS)',
  'cross-compliance': 'Cross Compliance',
  'basic-payment-scheme': 'Basic Payment Scheme (BPS)'
}
// 'none' is the explicit "Not scheme-specific" checkbox - a real answer,
// exclusive of every named scheme - so it is allowed alongside V4_SCHEMES
// wherever submitted scheme values are validated.
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

// The sample upload is the mock claim-processing guide (see
// app/data/v4-sample-document.js). Its title prefills the details step, and
// its version and last modified date are read from the document, so they are
// the same every time and cannot be changed.
const V4_UPLOAD_DEFAULT_TITLE =
  'Processing farmer claims using RPA processors and legacy systems'
const V4_UPLOAD_VERSION = '1.0'
const V4_UPLOAD_LAST_MODIFIED = '29 June 2026'

// Keep only the checkbox values the field knows about — a value can arrive
// as a string, an array, or the kit's "_unchecked" sentinel.
function v4Selected(value, allowed) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.filter((candidate) => allowed[candidate])
}

// The details are captured across two steps. Each step merges its own
// fields into the one session object, so a Change link back to any step
// leaves the others untouched. The object seeds with the facts read from the
// document (title, version, date), the fixed type, and everything else empty.
function v4Details(req) {
  return (
    req.session.data.v4UploadedGuide || {
      name: V4_UPLOAD_DEFAULT_TITLE,
      version: V4_UPLOAD_VERSION,
      lastModified: V4_UPLOAD_LAST_MODIFIED,
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

// Every question across the two steps is required. Each POST validates,
// re-rendering its own page with an error summary and inline messages when
// something is missing, and only saves and moves on when the step is valid.
const V4_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Step 1 of 2 — the facts read from the document (title editable; version and
// date read-only) plus the scheme(s) this guidance relates to.
//
// Either step can also be reached via a Change link from the check page
// (?from=check). When that's how a step was opened, the flag is carried
// through the form as a hidden field so Continue — and the back link —
// return straight to the check page instead of carrying on through the rest
// of the journey, rather than forcing the user to re-run the steps they
// weren't trying to change. The session already preserves every field
// regardless of route, since each step merges its own fields into the one
// object (see v4Details below) — only the *destination* after Continue
// changes.
router.get('/v4/upload-guide/metadata', (req, res) => {
  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check' ? '/v4/upload-guide/check' : '/v4/upload-guide'
  res.render('versions/v4/upload-metadata', {
    details: v4Details(req),
    errors: {},
    errorList: [],
    from
  })
})

router.post('/v4/upload-guide/metadata', (req, res) => {
  const title = (req.body.guideTitle || '').trim()
  const scheme = v4Selected(req.body.scheme, V4_SCHEME_VALUES)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!title)
    errors.guideTitle = { text: 'Enter a guidance title', href: '#guide-title' }
  if (!scheme.length) {
    errors.scheme = {
      text: "Select the scheme or schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  } else if (scheme.includes('none') && scheme.length > 1) {
    // No-JS fallback: the exclusive behaviour on 'none' is client-side only,
    // so a form submitted without it can still carry both.
    errors.scheme = {
      text: "Select the schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check' ? '/v4/upload-guide/check' : '/v4/upload-guide'
    return res.render('versions/v4/upload-metadata', {
      details: Object.assign({}, v4Details(req), { name: title, scheme }),
      errors,
      errorList: Object.values(errors),
      from
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
  res.redirect(
    from === 'check'
      ? '/v4/upload-guide/check'
      : '/v4/upload-guide/metadata/purpose'
  )
})

// Step 2 of 2 — who owns the guidance, what it aims to achieve, required
// knowledge and training, what systems it uses, and who it is for. The
// "who it is for" question originally had its own step (a third,
// audience-only page), but was folded in here since it's metadata like the
// rest of this step's fields rather than a distinct stage of the journey —
// see git history for the removed upload-metadata-usage.html.
router.get('/v4/upload-guide/metadata/purpose', (req, res) => {
  if (!req.session.data.v4UploadedGuide)
    return res.redirect('/v4/upload-guide/metadata')
  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check' ? '/v4/upload-guide/check' : '/v4/upload-guide/metadata'
  res.render('versions/v4/upload-metadata-purpose', {
    details: req.session.data.v4UploadedGuide,
    errors: {},
    errorList: [],
    from
  })
})

router.post('/v4/upload-guide/metadata/purpose', (req, res) => {
  const owner = (req.body.owner || '').trim()
  const goal = (req.body.goal || '').trim()
  const requirements = (req.body.requirements || '').trim()
  const systems = v4Selected(req.body.systems, V4_SYSTEMS)
  const audience = v4Selected(req.body.audience, V4_AUDIENCE)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!owner)
    errors.owner = { text: 'Enter the owner email address', href: '#owner' }
  else if (!V4_EMAIL_RE.test(owner))
    errors.owner = {
      text: 'Enter an email address in the correct format, like name@example.com',
      href: '#owner'
    }
  if (!goal)
    errors.goal = { text: 'Enter the purpose of this guidance', href: '#goal' }
  if (!requirements)
    errors.requirements = {
      text: 'Enter the required knowledge and training',
      href: '#requirements'
    }
  if (!systems.length)
    errors.systems = {
      text: 'Select the systems this guidance will use',
      href: '#systems'
    }
  if (!audience.length)
    errors.audience = {
      text: 'Select who this guidance is for',
      href: '#audience'
    }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check' ? '/v4/upload-guide/check' : '/v4/upload-guide/metadata'
    return res.render('versions/v4/upload-metadata-purpose', {
      details: Object.assign({}, v4Details(req), {
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

  // This is already the last step, so Continue always lands on the check
  // page regardless of `from` — but the flag still governs the back link
  // above, for consistency with step 1.
  const details = v4Details(req)
  details.owner = owner
  details.goal = goal
  details.requirements = requirements
  details.systems = systems
  details.audience = audience
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

  res.locals.backHref = '/v4/upload-guide/metadata/purpose'
  res.render('versions/v4/upload-check', {
    details,
    typeLabel: details.type,
    // 'none' isn't in V4_SCHEMES, so listOr drops it and falls back to
    // 'Not scheme-specific' whenever that's the only value selected.
    schemeLabel: listOr(details.scheme, V4_SCHEMES, 'Not scheme-specific'),
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
