const { guidanceDocuments } = require('../../../data/guidance-documents')
const { savedDocuments } = require('../../../data/saved-documents')
const { searchResults } = require('../../../data/search-results')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')
const { guidedSearches } = require('../../../data/guided-searches')
const guidanceLists = require('../../../data/guidance-lists')

// Shown if ai-search-results.html is reached without going through the form
// first — stepping back and forward, or a direct link — so the heading is
// never blank.
const DEFAULT_AI_SEARCH_QUERY =
  'I need to understand what evidence is required for the upland grazing option under SFI 23'
const DEFAULT_TOTAL_STEPS = 4
const DEFAULT_STEP = 1

// Both tabs' rows are session-backed lists of { id, lastModified } — see
// app/data/guidance-lists.js for the seeding/capping/update rules — each
// looked up in app/data/guidance-documents.js for its title/version.
function fromSession(req) {
  return {
    recentlyOpenedDocuments: guidanceLists.buildFindGuidanceRows(
      guidanceLists.getRecentlyOpened(req)
    ),
    savedGuidanceDocuments: guidanceLists.buildFindGuidanceRows(
      guidanceLists.getSavedGuidance(req)
    )
  }
}

function removeConfirmViewModel(req) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const tab = guidanceLists.REMOVE_CONFIRM_TABS[req.query.tab]

  return {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: tab ? tab.listName : null,
    returnHref: tab ? '/v6/find-guidance#' + tab.anchor : '/v6/find-guidance'
  }
}

// A document's read-only view — opened from the "Saved documents" tab on
// find-guidance.html, or from a result on organic-search.html (by way of
// document-overview.html) for a document not saved yet. guidanceDocuments
// is tried first, then savedDocuments/searchResults for the older ids still
// used by find-guidance.html's "Recently opened"/"Favourited guidance"
// tabs, then guidanceDocuments[0] if the id matches neither — so this never
// 404s or shows "Document not found", whichever flow reached it.
//
// A guidanceDocuments entry can carry its own "steps" array — when it
// does, that replaces the generic placeholder content entirely, and which
// step is showing is server-side state driven by ?step=, clamped to a
// valid step number, defaulting to 1. "steps" comes in two shapes: flat
// (one step per array entry, each with its own body) or nested (grouped
// smaller sub-steps under each top-level section as a "parts" array) —
// flattened here into customParts (every part in section order) plus
// customSections (the section names, for the sidebar).
function savedDocumentViewModel(req) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )
  const legacyDocument =
    savedDocuments.find((candidate) => candidate.id === req.params.id) ||
    searchResults.find((candidate) => candidate.id === req.params.id)

  const backHref =
    '/v6/document-overview/' +
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

  if (!guidanceDocument || !guidanceDocument.steps) {
    return {
      backHref,
      props: {
        id: req.params.id,
        documentName,
        version,
        documents: genericGuidanceContent
      }
    }
  }

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

    return {
      backHref,
      props: {
        id: req.params.id,
        documentName,
        version,
        customParts,
        customSections,
        currentStep: customParts[stepNumber - 1],
        stepNumber,
        totalSteps,
        documents: genericGuidanceContent
      }
    }
  }

  const totalSteps = guidanceDocument.steps.length
  const requestedStep = parseInt(req.query.step, 10)
  const stepNumber =
    requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

  return {
    backHref,
    props: {
      id: req.params.id,
      documentName,
      version,
      customSteps: guidanceDocument.steps,
      currentStep: guidanceDocument.steps[stepNumber - 1],
      stepNumber,
      totalSteps,
      documents: genericGuidanceContent
    }
  }
}

function organicSearchViewModel(req) {
  const results = guidanceDocuments.filter(
    (document) => document.showOnOrganicSearch
  )

  return {
    results,
    // Pre-fills and immediately applies the search box on find-guidance.html
    // (?q=) — the template's own script reads this same value back off the
    // pre-filled input rather than this being passed to it directly.
    initialSearchQuery: (req.query.q || '').trim(),
    resultsJson: JSON.stringify(
      results.map((document) => ({
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
  }
}

function aiSearchResultsViewModel(req) {
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

  return {
    id,
    step,
    totalSteps,
    query: req.session.data.aiSearchQuery || DEFAULT_AI_SEARCH_QUERY,
    // Drives the "Back" button next to Complete/Incomplete, which moves
    // between steps. Step 1's back goes to the search itself for a fresh
    // query; a resumed search did not come from there, so it goes to the
    // saved-searches list instead.
    backHref:
      step > 1
        ? `/v6/find-guidance/ai-search-results/${id}/${step - 1}`
        : search
          ? '/v6/find-guidance'
          : '/v6/find-guidance/ai-search',
    // Drives the govukBackLink at the top instead — the saved-searches list,
    // not a step.
    backLinkHref: '/v6/find-guidance',
    backLinkText: 'Back to your searches',
    completeHref:
      step < totalSteps
        ? `/v6/find-guidance/ai-search-results/${id}/${step + 1}`
        : '/v6/find-guidance'
  }
}

module.exports = {
  fromSession,
  removeConfirmViewModel,
  savedDocumentViewModel,
  organicSearchViewModel,
  aiSearchResultsViewModel
}
