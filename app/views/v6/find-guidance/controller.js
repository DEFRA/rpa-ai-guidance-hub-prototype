const { guidanceDocuments } = require('../../../data/guidance-documents')
const guidanceLists = require('../../../data/guidance-lists')
const viewModel = require('./view-model')

// No backHref — find-guidance.html shows breadcrumbs instead of a Back
// link now (see the template).
function get(req, res) {
  res.render('versions/v6/find-guidance', viewModel.fromSession(req))
}

function getNew(req, res) {
  res.locals.backHref = '/v6/find-guidance'
  res.render('versions/v6/find-guidance-new')
}

function postNew(req, res) {
  res.redirect(
    req.body.searchMethod === 'ai'
      ? '/v6/find-guidance/ai-search'
      : '/v6/find-guidance/organic-search'
  )
}

// Confirms removing a row from either tab on find-guidance.html — reached
// from that page's own "Remove" links, which carry ?id= and ?tab=
// (recently-opened or saved-guidance). "Yes, remove" itself is a real
// POST — see postRemove below — id/tab are carried into it as hidden form
// fields rather than read back off this GET's own query string a second
// time.
function getRemoveConfirm(req, res) {
  res.locals.backHref = '/v6/find-guidance'
  res.render(
    'versions/v6/delete-search-confirm',
    viewModel.removeConfirmViewModel(req)
  )
}

// A real POST — this actually takes the entry out of
// req.session.data.recentlyOpened or .savedGuidance, so it stays gone on
// the next visit rather than only looking removed until the session's
// underlying array is read again. Falls back to just redirecting straight
// back if id/tab don't resolve to a real list.
function postRemove(req, res) {
  const tab = guidanceLists.REMOVE_CONFIRM_TABS[req.body.tab]
  const list = guidanceLists.getListForTab(req, req.body.tab)

  if (list && req.body.id) {
    const index = list.findIndex((entry) => entry.id === req.body.id)
    if (index !== -1) list.splice(index, 1)
  }

  res.redirect(tab ? '/v6/find-guidance#' + tab.anchor : '/v6/find-guidance')
}

// Tracks this as a "recently opened" document — but only on the actual
// entry into it (the "Open" button on document-overview.html links here
// with no ?step=), not on every subsequent Back/Next/sidebar/dropdown/
// search navigation between its own steps, which all stay on this same
// route with a ?step= of their own.
function getDocument(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )

  if (guidanceDocument && !req.query.step) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
  }

  const { backHref, props } = viewModel.savedDocumentViewModel(req)
  res.locals.backHref = backHref
  res.render('versions/v6/saved-document-view', props)
}

// No backHref — organic-search.html shows breadcrumbs instead of a Back
// link now (see the template).
function getOrganicSearch(req, res) {
  res.render(
    'versions/v6/organic-search',
    viewModel.organicSearchViewModel(req)
  )
}

// Server-side counterpart to document-overview.html's "Save to search"
// button. Responds with no body either way — the client-side fetch call
// doesn't do anything with the response.
function postSaveToSearch(req, res) {
  if (req.body && req.body.id) {
    guidanceLists.addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
}

// Search by explaining the problem, rather than by document.
function getAiSearch(req, res) {
  res.locals.backHref = '/v6/find-guidance/new'
  res.render('versions/v6/ai-search')
}

// The wait between submitting a query and seeing results. Nothing here is a
// real search yet, so this only remembers the query text for
// ai-search-results.html's heading. Redirects to the GET route rather than
// rendering directly, so refreshing the loading page does not resubmit it.
function postAiSearchLoading(req, res) {
  req.session.data.aiSearchQuery = (req.body.query || '').trim()
  res.redirect('/v6/find-guidance/ai-search-loading')
}

function getAiSearchLoading(req, res) {
  res.render('versions/v6/ai-search-loading')
}

// Reached two ways: fresh from the form on ai-search.html (no :id), or
// resumed from a row in the "Guided searches" tab on find-guidance.html
// (:id identifies which fixed example search this is).
function getAiSearchResults(req, res) {
  res.render(
    'versions/v6/ai-search-results',
    viewModel.aiSearchResultsViewModel(req)
  )
}

module.exports = {
  get,
  getNew,
  postNew,
  getRemoveConfirm,
  postRemove,
  getDocument,
  getOrganicSearch,
  postSaveToSearch,
  getAiSearch,
  getAiSearchLoading,
  postAiSearchLoading,
  getAiSearchResults
}
