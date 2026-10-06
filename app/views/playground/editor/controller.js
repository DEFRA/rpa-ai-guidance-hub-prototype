const {
  getPlaygroundApiGuides
} = require('../../../data/playground-api-guides')
const { canEdit } = require('../../../data/permissions')
const lifecycle = require('../../../data/guide-lifecycle')
const { loadEditorSections } = require('./view-model')
const { buildMetadata, buildPanelState } = require('../guide/view-model')
const {
  buildEditorExperimentComments,
  buildAddedCommentAnchors
} = require('../../../data/editor-experiment')

// The one canonical document editor. Driven by the guide ?id= names (API
// guides included) via view-model.js; a visit with no ?id=, or one matching
// no guide, shows the fixed "SFI 23 Guidance document" sample. ?title= (only
// used when ?id= matches nothing) names the document for the "Guidance
// converted" flow, which has no real id to thread through.
async function get(req, res) {
  await getPlaygroundApiGuides(req)
  // A guide's editor is its draft: only someone who can edit may open it, and
  // only while it is a Draft (Awaiting review is locked).
  const id = req.query.id
  if (id && lifecycle.lookupGuide(req, id)) {
    const draft = lifecycle.getDraft(req, id)
    if (!canEdit(req, id) || !draft || draft.state !== 'draft') {
      res.redirect('/playground/guide/' + encodeURIComponent(id))
      return
    }
  }

  const editorSections = await loadEditorSections(req, id)
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  // Restores in-progress edits when returning via "Back to editor" from the
  // Preview flow — only when the stored preview's id still matches the
  // document (or fixed sample, both '') being opened here.
  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  const knownGuide = id && lifecycle.lookupGuide(req, id)
  res.render('playground/editor/page.njk', {
    documentTitle: (knownGuide && knownGuide.title) || req.query.title || null,
    editorSections,
    metadata: knownGuide ? buildMetadata(req, id, knownGuide) : null,
    issuesHref: knownGuide
      ? '/playground/issues/' + encodeURIComponent(id)
      : null,
    ...buildPanelState(req),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
}

module.exports = { get }
