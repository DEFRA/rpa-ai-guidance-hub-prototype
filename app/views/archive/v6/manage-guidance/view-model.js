const {
  getAddedEditingIds,
  buildManageGuidanceRows,
  MANAGE_GUIDANCE_PUBLISHED_SAMPLES,
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

// The overview a Document name link on all-guidance-docs.html/
// manage-guidance-search.html/search-guidance.html now leads to, instead of
// straight into Edit or the old Action column's buttons — a stop in
// between, shaped differently depending on the document's state. ?id= is
// looked up against buildManageGuidanceRows() first (Editing, then
// Awaiting approval), then MANAGE_GUIDANCE_PUBLISHED_SAMPLES if neither
// matched. Returns null when nothing matches at all, so the caller can
// redirect rather than render.
//
// status is "Draft" for an editingMatch, not "Editing" — matching the
// state-based layouts' own status badge text, and what search-guidance.html's
// own State filter already calls this same state ("Editing" was this page's
// own, now-retired, name for it — see the git history on this function). No
// other code reads this value; it exists purely for the template's own
// {% if status == ... %} branches and status-badge lookup below, so
// renaming it here doesn't touch anything else.
//
// defaultVersionKey/versionsJson (and document.versions, for the template's
// own server-rendered initial values) drive document-overview.html's
// Version dropdown, the same pattern app/views/versions/v6/document-
// overview.html (the find-guidance side) already uses. An editingMatch/
// awaitingApprovalMatch row is usually a real guidance-documents.js entry
// under the hood (see buildManageGuidanceRows' own
// lookupGuidanceDocumentByTitle) but buildManageGuidanceRows strips its own
// rows down to just id/name/version/publishingChecks/changesRequested/
// lastModified — versions.version1/version2 isn't one of them, so it's
// looked up again here, directly, just for this one field this page alone
// needs. lookupAnyManageGuidanceDocument, not a plain guidanceDocuments
// lookup: an editingMatch can also be a Published sample document moved
// into Editing via "Edit" (manageGuidanceEditingAddedIds — see
// buildManageGuidanceRows' own addedFromPublished), which only ever
// existed in MANAGE_GUIDANCE_PUBLISHED_SAMPLES, never guidanceDocuments —
// that fallback is exactly what this helper already provides.
// MANAGE_GUIDANCE_PUBLISHED_SAMPLES entries carry their own
// versions.version1/version2 already (added specifically for this).
function documentOverviewViewModel(req) {
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  const editingMatch = editingDocuments.find(
    (candidate) => candidate.id === req.query.id
  )
  const awaitingApprovalMatch = awaitingApprovalDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  if (editingMatch || awaitingApprovalMatch) {
    const row = editingMatch || awaitingApprovalMatch
    const fullDocument = lookupAnyManageGuidanceDocument(row.id)

    return {
      document: { ...row, versions: fullDocument.versions },
      status: editingMatch ? 'Draft' : 'Awaiting approval',
      defaultVersionKey: row.version === 'Version 1' ? 'version1' : 'version2',
      versionsJson: JSON.stringify(fullDocument.versions)
    }
  }

  const publishedMatch = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find(
    (candidate) => candidate.id === req.query.id
  )
  if (!publishedMatch) return null

  return {
    document: {
      id: publishedMatch.id,
      name: publishedMatch.title,
      version: publishedMatch.version,
      versions: publishedMatch.versions
    },
    status: 'Published',
    defaultVersionKey:
      publishedMatch.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(publishedMatch.versions)
  }
}

// Confirms removing a row from the Editing tab on all-guidance-docs.html —
// reached from that table's own "Remove" links, which carry ?id=. Only
// looks the id up against editingDocuments, not awaitingApprovalDocuments
// too — an Awaiting approval id reaching this page is exactly as unmatched
// as one that does not exist at all, since there is nothing here for it to
// remove.
function removeConfirmViewModel(req) {
  const { editingDocuments } = buildManageGuidanceRows(req)
  const document = editingDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  return {
    documentId: req.query.id,
    documentTitle: document ? document.name : null
  }
}

module.exports = { documentOverviewViewModel, removeConfirmViewModel }
