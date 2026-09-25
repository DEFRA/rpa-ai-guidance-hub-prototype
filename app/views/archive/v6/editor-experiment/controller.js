const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')
const {
  buildEditorSections,
  getEditorExperimentReplies,
  getEditorExperimentDeletedCommentIds,
  getEditorExperimentAddedComments,
  buildEditorExperimentComments,
  buildAddedCommentAnchors
} = require('../../../data/editor-experiment')

// Same standalone design experiment as v5's, but driven by whichever
// document ?id= names (the destination of "Continue editing" on
// /v6/manage-guidance/document-overview.html) rather than always showing
// the same fixed "SFI 23 Guidance document" sample. A direct visit with no
// ?id=, or one that matches no guidance-documents.js entry, falls back to
// rendering with neither variable set — see the template, which then shows
// the exact same fixed sample content it always has.
function get(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const comments = buildEditorExperimentComments(req)
  const addedCommentAnchorsJson = JSON.stringify(buildAddedCommentAnchors(req))

  // Restores in-progress edits when returning via "Back to editor" from the
  // Preview flow — only when the stored preview's id still matches the
  // document (or fixed sample, both '') being opened here, so previewing
  // one document and then separately opening a different one does not leak
  // the first one's draft into it.
  const preview = req.session.data.editorExperimentPreview
  const restoredEditorHtml =
    preview && preview.id === (req.query.id || '') ? preview.html : null

  if (!guidanceDocument) {
    res.render('versions/v6/editor-experiment', {
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
    return
  }

  res.render('versions/v6/editor-experiment', {
    documentTitle: guidanceDocument.title,
    guidanceDocumentId: guidanceDocument.id,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
}

// Persists the editor's current live content (including unsaved edits and
// any reordering, since nothing on this page is saved until "Save") into
// req.session.data.editorExperimentPreview, so getPreview below can render
// it. "steps" is already split into one entry per Content-nav section by
// the client. Fire-and-forget from the client, the same way
// postReply/postDelete/postAddComment below are.
function postPreview(req, res) {
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
}

// Renders the REAL saved-document-view.html customSteps stepper from the
// in-progress content captured above rather than from any
// guidance-documents.js entry. stepLinkBase keeps the sidebar/Back/Next
// links pointed at this route rather than their normal
// /v6/find-guidance/document/:id target, since a live editor draft has no
// such id to navigate back to. A direct visit with nothing captured yet
// falls back to the editor rather than erroring.
function getPreview(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview || !preview.steps.length) {
    res.redirect('/v6/editor-experiment')
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
    '/v6/editor-experiment' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('versions/v6/saved-document-view', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    version: guidanceDocument ? guidanceDocument.version : 'Version 1',
    documents: genericGuidanceContent,
    customSteps: preview.steps,
    currentStep: preview.steps[stepNumber - 1],
    stepNumber,
    totalSteps,
    isPreview: true,
    stepLinkBase: '/v6/editor-experiment/preview'
  })
}

// Persists a reply added through a thread's "Reply" control — the client
// already shows the new reply instantly, this is fire-and-forget the same
// way "Save to search" on document-overview.html is.
function postReply(req, res) {
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
}

// Removes a comment (and, for a threaded one, its whole thread) via a
// card's "Delete" control, on either editor-experiment.html or its
// narrow-container duplicate. The client already removes the card from the
// page instantly, this is fire-and-forget the same way postReply above is.
function postDelete(req, res) {
  const commentId = req.body && req.body.commentId

  if (commentId) {
    const deletedIds = getEditorExperimentDeletedCommentIds(req)
    if (!deletedIds.includes(commentId)) deletedIds.push(commentId)
    delete getEditorExperimentReplies(req)[commentId]
  }

  res.status(204).end()
}

// Persists a comment created live off the toolbar's own Comment icon
// (data-tt-comment, editor-experiment.html's pageScripts) — either
// anchored to a selection at the time it was clicked, or not, if nothing
// was selected. anchorId/sectionId/selectedText are only sent for the
// anchored kind (the client omits them entirely otherwise, so they arrive
// here as undefined rather than empty strings): sectionId + selectedText
// are what buildAddedCommentAnchors (app/data/editor-experiment.js) uses
// to tell the client which substring to re-wrap in an app-editor-anchor
// span inside which section on a later page load. commentId/anchorId are
// both generated client-side and simply trusted here.
function postAddComment(req, res) {
  const commentId = req.body && req.body.commentId
  const anchorId = req.body && req.body.anchorId
  const sectionId = req.body && req.body.sectionId
  const text = req.body && (req.body.text || '').trim()
  const selectedText = req.body && req.body.selectedText

  if (commentId && text) {
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
}

module.exports = {
  get,
  postPreview,
  getPreview,
  postReply,
  postDelete,
  postAddComment
}
