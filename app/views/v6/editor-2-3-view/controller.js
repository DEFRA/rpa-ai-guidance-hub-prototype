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
const {
  getAddedAwaitingApprovalIds,
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

// The v6 editor entry point (every "Continue editing"/"Edit" link across
// v6 now points here rather than at /v6/editor-experiment — see the audit
// this was built from). A near-exact duplicate of
// app/views/v6/editor-experiment/controller.js, not a wrapper around it —
// same reasoning app/views/v6/manage-guidance/controller.js's own
// getEditorExperimentNarrow already established for editor-experiment.html's
// other duplicate (its own narrow-container comparison page): each page
// gets its own controller, but all three share the same underlying
// app/data/editor-experiment.js session helpers (getEditorExperimentReplies/
// DeletedCommentIds/AddedComments, buildEditorExperimentComments,
// buildAddedCommentAnchors) and the same session keys
// (editorExperimentReplies/DeletedCommentIds/AddedComments,
// editorExperimentPreview) — a comment, reply, delete or in-progress
// Preview draft made on this page is visible on editor-experiment.html
// too, and vice versa, intentionally: they're different visual treatments
// of the same editing session, not independent ones.
//
// Driven by whichever document ?id= names (the destination of "Continue
// editing" on /v6/manage-guidance/document-overview.html) rather than
// always showing the same fixed "SFI 23 Guidance document" sample. A
// direct visit with no ?id=, or one that matches no guidance-documents.js
// entry, falls back to rendering with neither variable set — see the
// template, which then shows the exact same fixed sample content it
// always has.
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
    res.render('versions/v6/editor-2-3-view', {
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
    return
  }

  res.render('versions/v6/editor-2-3-view', {
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
    res.redirect('/v6/editor-2-3-view')
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
    '/v6/editor-2-3-view' +
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
    stepLinkBase: '/v6/editor-2-3-view/preview'
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
// card's "Delete" control. The client already removes the card from the
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
// (data-tt-comment, pageScripts) — either anchored to a selection at the
// time it was clicked, or not, if nothing was selected. anchorId/
// sectionId/selectedText are only sent for the anchored kind (the client
// omits them entirely otherwise, so they arrive here as undefined rather
// than empty strings): sectionId + selectedText are what
// buildAddedCommentAnchors (app/data/editor-experiment.js) uses to tell
// the client which substring to re-wrap in an app-editor-anchor span
// inside which section on a later page load. commentId/anchorId are both
// generated client-side and simply trusted here.
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

// "Send for approval" (footer bar) — captures the editor's current live
// content first (same fetch, same payload shape, as "Save"/"Preview" —
// see pageScripts), then navigates here rather than acting immediately:
// a review step before the status actually changes, per the task this was
// built from. Reads the just-captured req.session.data.editorExperimentPreview
// (the same session object getPreview above reads) for title/steps.
// lookupAnyManageGuidanceDocument (app/data/manage-guidance.js), not a
// plain guidanceDocuments lookup, for the real description — an Editing
// document opened here can be either a real guidanceDocuments entry or a
// sample Published document moved into Editing via "Start editing" (only
// ever in MANAGE_GUIDANCE_PUBLISHED_SAMPLES, never guidanceDocuments; see
// that helper's own comment) — the same fallback
// app/views/v6/manage-guidance/view-model.js already needed for exactly
// this reason. A direct visit with nothing captured yet falls back to the
// editor rather than erroring, the same guard getPreview above uses.
function getSendForApproval(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview) {
    res.redirect('/v6/editor-2-3-view')
    return
  }

  const document = preview.id
    ? lookupAnyManageGuidanceDocument(preview.id)
    : null

  res.locals.backHref =
    '/v6/editor-2-3-view' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('v6/editor-2-3-view/send-for-approval.njk', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    description: document
      ? document.description
      : 'No description is available for this sample document.',
    sections: preview.steps
  })
}

// The confirmation page's own "Send for approval" button — the real state
// change: adds the id to req.session.data.manageGuidanceAwaitingApprovalAddedIds
// (app/data/manage-guidance.js), so buildManageGuidanceRows moves this row
// out of Editing and into Awaiting approval for the rest of the session —
// visible immediately on /v6/manage-guidance/document-overview (Awaiting
// approval badge, no edit option) and the unified hub's own Awaiting
// approval tab, not just a cosmetic label on this one page. A fixed-sample
// draft (no real id) has nothing to move, so this just returns to the
// editor for that case.
function postSendForApproval(req, res) {
  const preview = req.session.data.editorExperimentPreview
  const id = (preview && preview.id) || ''

  if (!id) {
    res.redirect('/v6/editor-2-3-view')
    return
  }

  const addedIds = getAddedAwaitingApprovalIds(req)
  if (addedIds.indexOf(id) === -1) addedIds.push(id)

  res.redirect(
    '/v6/manage-guidance/document-overview?id=' + encodeURIComponent(id)
  )
}

module.exports = {
  get,
  postPreview,
  getPreview,
  postReply,
  postDelete,
  postAddComment,
  getSendForApproval,
  postSendForApproval
}
