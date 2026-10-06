//
// editor-experiment.html's data and session-backed helpers — the sidebar/
// content sections built from a guidance-documents.js entry, the sample
// Comments/Checks shown in the Changes panel, and the replies/deletions/
// added comments a session accumulates against them.
//
// Shared, unmodified, by v5's /v5/editor-experiment... routes (see
// app/views/legacy/routes.js) and v6's /v6/editor-experiment... routes (see
// app/views/v6/editor-experiment/) — session data is not namespaced per
// version, so replying to, deleting, or adding a comment in one also shows
// up in the other, the same reasoning app/data/guidance-lists.js documents
// for find-guidance's own session lists.
//

const {
  documents: genericGuidanceContent
} = require('./generic-guidance-content')

// Flattens a guidanceDocuments entry's own content into one entry per
// editor-experiment.html section, in one consistent shape regardless of
// which of the three content formats this prototype has: id (section-1,
// section-2, ..., matching the sidebar's #section-N anchors and the
// Comments/Checks panel's data-target-section values), name (the sidebar
// link text), heading (the h2 inside the content itself) and body (an
// array of paragraph strings/bullet-list arrays). Returns null for a
// document with no content this route knows how to render at all — the
// route falls back to the fixed sample content for that, not this
// function.
function buildEditorSections(guidanceDocument) {
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
      return sections
    }

    return guidanceDocument.steps.map((step, index) => ({
      id: `section-${index + 1}`,
      name: step.sectionName,
      heading: step.heading,
      body: step.body
    }))
  }

  // The generic 3-phase placeholder flow — genericGuidanceContent falls
  // back to countryside-stewardship-capital-grants for an id with no entry
  // of its own, same as saved-document-view.html's own lookup.
  const genericDocument =
    genericGuidanceContent[guidanceDocument.id] ||
    genericGuidanceContent['countryside-stewardship-capital-grants']
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
  return sections
}

// The editor starts with no comments: everything on the Comments tab is added
// (or replied to) during the session. Kept as a seed hook for future samples.
const EDITOR_EXPERIMENT_COMMENTS = []

// Replies added through a thread's "Reply" control on editor-experiment.html
// — keyed by comment id (EDITOR_EXPERIMENT_COMMENTS above), so they can be
// merged onto that thread's own sample replies without touching the other
// comments. Same seed-empty-on-first-read convention as
// app/data/guidance-lists.js's getRecentlyOpened/getSavedGuidance.
function getEditorExperimentReplies(req) {
  if (!req.session.data.editorExperimentReplies) {
    req.session.data.editorExperimentReplies = {}
  }
  return req.session.data.editorExperimentReplies
}

// Comment ids removed via a card's "Delete" control — filtered out of
// EDITOR_EXPERIMENT_COMMENTS above rather than mutating that constant, same
// removed-id-list convention as getRemovedEditingIds in
// app/data/manage-guidance.js. Deleting a comment also drops any of its own
// session-persisted replies, so a later comment reusing the same id doesn't
// inherit an orphaned thread.
function getEditorExperimentDeletedCommentIds(req) {
  if (!req.session.data.editorExperimentDeletedCommentIds) {
    req.session.data.editorExperimentDeletedCommentIds = []
  }
  return req.session.data.editorExperimentDeletedCommentIds
}

// Comments created live in editor-experiment.html's pageScripts — kept
// separate from the fixed EDITOR_EXPERIMENT_COMMENTS array above rather
// than pushed into it, since that constant is a shared module-level value,
// not something a request should mutate. v5's own trigger for this is
// still selecting text directly (frozen, unchanged); v6's is its
// toolbar's own Comment icon, which can also add a comment with nothing
// selected — that kind has no anchorId/sectionId/selectedText of its own
// (see postAddComment, app/views/v6/editor-experiment/controller.js).
// Where present, anchorId/sectionId/selectedText carry enough to restore
// the comment's anchor span in the editor content on a later page load —
// see buildAddedCommentAnchors below and restoreAddedCommentAnchors in
// pageScripts.
function getEditorExperimentAddedComments(req) {
  if (!req.session.data.editorExperimentAddedComments) {
    req.session.data.editorExperimentAddedComments = []
  }
  return req.session.data.editorExperimentAddedComments
}

function buildEditorExperimentComments(req) {
  const sessionReplies = getEditorExperimentReplies(req)
  const deletedIds = getEditorExperimentDeletedCommentIds(req)
  const seeded = EDITOR_EXPERIMENT_COMMENTS.filter(
    (comment) => !deletedIds.includes(comment.id)
  ).map((comment) => ({
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
// that has an anchor at all — everything editor-experiment.html's
// pageScripts needs to re-wrap that exact substring inside section
// sectionId in a fresh app-editor-anchor span on page load. Deleted
// comments are already excluded. v6's own toolbar Comment icon can also
// add a comment with nothing selected (no anchor at all, always sorting
// to the end of the list — see wireAddCommentButton there) — filtered out
// here too, alongside deleted ones, since there is nothing to restore for
// one of those.
function buildAddedCommentAnchors(req) {
  const deletedIds = getEditorExperimentDeletedCommentIds(req)
  return getEditorExperimentAddedComments(req)
    .filter((comment) => !deletedIds.includes(comment.id) && comment.anchorId)
    .map((comment) => ({
      anchorId: comment.anchorId,
      sectionId: comment.sectionId,
      selectedText: comment.selectedText
    }))
}

// The Checks tab's fixed sample findings — previously hardcoded
// independently in editor-2-3-view.html's own template ({% set checks =
// [...] %}) and, differently, in guidance-document.html's own severities
// structure, so the two pages' "Checks"/"Publishing checks" content never
// actually matched. Single-sourced here instead, so both pages render
// this exact same list — each check carries a stable id so a link from
// one page to the other (guidance-document.html's own "Issue" links,
// ?checkId= on /v6/editor-2-3-view) can point at one specific check.
//
// section matches one of EDITOR_EXPERIMENT_CHECK_SECTIONS' own ids below
// — the same fixed sample content editor-2-3-view.html falls back to
// whenever ?id= is missing or matches no guidance-documents.js entry (see
// that template's own `sections` default). Checks are not themselves
// per-document — there is no real per-document quality-check dataset yet
// (see guidance-document.html's own comment) — so they always refer to
// that one fixed sample's section names regardless of which real
// document, if any, either page is currently showing.
const EDITOR_EXPERIMENT_CHECKS = [
  {
    id: 'check-1',
    text: 'Payment rate figure is outdated',
    severity: 'High',
    section: 'section-3'
  },
  {
    id: 'check-2',
    text: 'Missing alt text on supporting image',
    severity: 'Medium',
    section: 'section-5'
  },
  {
    id: 'check-3',
    text: 'Heading level skips from H2 to H4',
    severity: 'Low',
    section: 'section-4'
  },
  {
    id: 'check-4',
    text: 'Broken internal link to related guidance',
    severity: 'Medium',
    section: 'section-6'
  },
  {
    id: 'check-5',
    text: 'Sentence exceeds recommended reading age',
    severity: 'Low',
    section: 'section-2'
  }
]

// Display names for EDITOR_EXPERIMENT_CHECKS' own section ids — the exact
// same fixed sample section names editor-2-3-view.html's own `sections`
// default already uses, kept in sync by hand since that default is
// markup, not something this module can read back.
const EDITOR_EXPERIMENT_CHECK_SECTIONS = {
  'section-1': 'Overview',
  'section-2': 'Eligibility criteria',
  'section-3': 'Payment rates',
  'section-4': 'Application process',
  'section-5': 'Supporting evidence',
  'section-6': 'Review dates'
}

module.exports = {
  buildEditorSections,
  getEditorExperimentReplies,
  getEditorExperimentDeletedCommentIds,
  getEditorExperimentAddedComments,
  buildEditorExperimentComments,
  buildAddedCommentAnchors,
  EDITOR_EXPERIMENT_CHECKS,
  EDITOR_EXPERIMENT_CHECK_SECTIONS
}
