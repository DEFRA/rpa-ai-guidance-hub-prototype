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

// The one canonical document editor — the consolidation plan's "no debate"
// decision, ported from /v5/editor-experiment (richest toolbar: undo/redo,
// full formatting, images, search, dark mode). /v6/editor-2-3-view and its
// /v6/editor-experiment twin are retired; every "Edit"/"Continue editing"
// link in the consolidated build points here instead. Driven by whichever
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
    res.render('consolidated/editor/page.njk', {
      documentTitle: req.query.title || null,
      comments,
      addedCommentAnchorsJson,
      restoredEditorHtml
    })
    return
  }

  res.render('consolidated/editor/page.njk', {
    documentTitle: guidanceDocument.title,
    editorSections: buildEditorSections(guidanceDocument),
    comments,
    addedCommentAnchorsJson,
    restoredEditorHtml
  })
}

// Persists the editor's current live content (including unsaved edits and
// any reordering, since nothing here is saved until "Save") — shared by
// Preview and Send for approval, which both capture the same draft before
// navigating on. "steps" is already split into one entry per Content-nav
// section by the client (buildCustomStepsFromEditor, page.njk).
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

// Renders the real stepper viewer from the in-progress content captured
// above, rather than from any guidance-documents.js entry — the same
// template/branch a document with real flat "steps" already uses.
function getPreview(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview || !preview.steps.length) {
    res.redirect('/consolidated/editor')
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
    '/consolidated/editor' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('consolidated/document-viewer/stepper.njk', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    version: guidanceDocument ? guidanceDocument.version : 'Version 1',
    documents: genericGuidanceContent,
    customSteps: preview.steps,
    currentStep: preview.steps[stepNumber - 1],
    stepNumber,
    totalSteps,
    isPreview: true,
    stepLinkBase: '/consolidated/editor/preview'
  })
}

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

function postDelete(req, res) {
  const commentId = req.body && req.body.commentId

  if (commentId) {
    const deletedIds = getEditorExperimentDeletedCommentIds(req)
    if (!deletedIds.includes(commentId)) deletedIds.push(commentId)
    delete getEditorExperimentReplies(req)[commentId]
  }

  res.status(204).end()
}

function postAddComment(req, res) {
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
}

// "Send for approval" (sidebar button) — captures the editor's current live
// content first (same fetch, same payload shape, as Preview — see
// page.njk's pageScripts), then navigates here rather than acting
// immediately: a review step before the status actually changes. Ported
// from the now-retired /v6/editor-2-3-view, whose own version of this route
// already closed the gap the consolidation plan's crawl found — no editor
// continued past "Send for approval" before this.
function getSendForApproval(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview) {
    res.redirect('/consolidated/editor')
    return
  }

  const document = preview.id
    ? lookupAnyManageGuidanceDocument(preview.id)
    : null

  res.locals.backHref =
    '/consolidated/editor' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('consolidated/editor/send-for-approval.njk', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    description: document
      ? document.description
      : 'No description is available for this sample document.',
    sections: preview.steps
  })
}

// The confirmation page's own "Send for approval" button — the real state
// change: adds the id to req.session.data.manageGuidanceAwaitingApprovalAddedIds,
// so buildManageGuidanceRows moves this row out of Editing and into
// Awaiting approval for the rest of the session — visible immediately on
// its document overview page and the hub's own Awaiting approval tab. A
// fixed-sample draft (no real id) has nothing to move, so this just returns
// to the editor for that case.
function postSendForApproval(req, res) {
  const preview = req.session.data.editorExperimentPreview
  const id = (preview && preview.id) || ''

  if (!id) {
    res.redirect('/consolidated/editor')
    return
  }

  const addedIds = getAddedAwaitingApprovalIds(req)
  if (addedIds.indexOf(id) === -1) addedIds.push(id)

  res.redirect('/consolidated/document/' + encodeURIComponent(id))
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
