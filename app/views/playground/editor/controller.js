const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  buildEditorSections,
  buildEditorExperimentComments,
  buildAddedCommentAnchors
} = require('../../../data/editor-experiment')

// The one canonical document editor — the consolidation plan's "no debate"
// decision, ported from /v5/editor-experiment (richest toolbar: undo/redo,
// full formatting, images, search, dark mode). /v6/editor-2-3-view and its
// /v6/editor-experiment twin are retired; every "Edit"/"Continue editing"
// link in the playground build points here instead. Driven by whichever
// document ?id= names — a direct visit with no ?id=, or one matching
// nothing, falls back to the same fixed "SFI 23 Guidance document" sample
// this page has always shown.
//
// ?title= (only used when ?id= matches nothing) lets a caller with no real
// guidanceDocuments entry still show its own document's name here instead
// of "SFI 23" — see the "Guidance converted" page's own use of this: that
// flow never creates a tracked document (its details are session-only), so
// there is no real id to thread through, but the consolidation plan still
// flagged its "View the guidance" link as always showing the wrong name,
// which this fixes without inventing a fuller draft-persistence feature
// this build wasn't asked for.
function get(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  // Restores in-progress edits when returning via "Back to editor" from the
  // Preview flow — only when the stored preview's id still matches the
  // document (or fixed sample, both '') being opened here.
  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('playground/editor/page.njk', {
      documentTitle: req.query.title || null,
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
    return
  }

  res.render('playground/editor/page.njk', {
    documentTitle: guidanceDocument.title,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
}

module.exports = { get }
