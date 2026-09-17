const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  getAddedEditingIds,
  getRemovedEditingIds,
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')
const {
  buildEditorSections,
  buildEditorExperimentComments,
  buildAddedCommentAnchors
} = require('../../../data/editor-experiment')
const viewModel = require('./view-model')

// No backHref on either render below — the template shows a breadcrumb
// back to Manage guidance instead of a Back link. An id that matches
// nothing at all — a stale/mistyped link — redirects back to
// /v6/all-guidance-docs rather than erroring or showing a broken page.
function getDocumentOverview(req, res) {
  const props = viewModel.documentOverviewViewModel(req)

  if (!props) {
    res.redirect('/v6/all-guidance-docs')
    return
  }

  res.render('versions/v6/manage-guidance/document-overview', props)
}

// "Start editing" on document-overview.html's Published branch — adds id
// to req.session.data.manageGuidanceEditingAddedIds, so the document moves
// from Published to Editing/Draft for the rest of the session. Straight on
// to the editor afterwards — the same /v6/editor-experiment?id= destination
// "Continue editing" already uses.
function postStartEditing(req, res) {
  if (req.body.id) {
    const addedIds = getAddedEditingIds(req)
    if (addedIds.indexOf(req.body.id) === -1) addedIds.push(req.body.id)
  }

  res.redirect(
    '/v6/editor-experiment?id=' + encodeURIComponent(req.body.id || '')
  )
}

function getRemoveConfirm(req, res) {
  res.locals.backHref = '/v6/all-guidance-docs'
  res.render(
    'versions/v6/manage-guidance/remove-confirm',
    viewModel.removeConfirmViewModel(req)
  )
}

// "Yes, remove" on remove-confirm.html — adds id to
// req.session.data.manageGuidanceEditingRemovedIds, then back to
// all-guidance-docs.html at the Editing tab's own #editing anchor.
function postRemove(req, res) {
  if (req.body.id) {
    const removedIds = getRemovedEditingIds(req)
    if (removedIds.indexOf(req.body.id) === -1) removedIds.push(req.body.id)
  }

  res.redirect('/v6/all-guidance-docs#editing')
}

// A fully independent duplicate of /v6/find-guidance/organic-search — same
// search/filter/sort mechanics, but its own dataset and its own State
// filter alongside Category/Scheme/Year/Version. ?q= pre-fills and
// immediately applies the search box on all-guidance-docs.html.
function getSearchGuidance(req, res) {
  const results = buildManageGuidanceSearchResults(
    req,
    '/v6/manage-guidance/document-overview'
  )

  res.render('versions/v6/manage-guidance/search-guidance', {
    results,
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
        year: document.year,
        state: document.state,
        overviewHref: document.overviewHref
      }))
    )
  })
}

// Narrow-container comparison duplicate of /v6/editor-experiment — same
// documentTitle/editorSections/comments/addedCommentAnchorsJson data.
// Not linked from anywhere in the UI; reached only by visiting this URL
// directly.
function getEditorExperimentNarrow(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('versions/v6/manage-guidance/editor-experiment-narrow', {
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
    return
  }

  res.render('versions/v6/manage-guidance/editor-experiment-narrow', {
    documentTitle: guidanceDocument.title,
    guidanceDocumentId: guidanceDocument.id,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
}

module.exports = {
  getDocumentOverview,
  postStartEditing,
  getRemoveConfirm,
  postRemove,
  getSearchGuidance,
  getEditorExperimentNarrow
}
