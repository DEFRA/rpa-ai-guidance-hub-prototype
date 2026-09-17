const {
  getAddedEditingIds,
  buildManageGuidanceRows,
  MANAGE_GUIDANCE_PUBLISHED_SAMPLES
} = require('../../../data/manage-guidance')

// The overview a Document name link on all-guidance-docs.html/
// manage-guidance-search.html/search-guidance.html now leads to, instead of
// straight into Edit or the old Action column's buttons — a stop in
// between, shaped differently depending on the document's state. ?id= is
// looked up against buildManageGuidanceRows() first (Editing, then
// Awaiting approval), then MANAGE_GUIDANCE_PUBLISHED_SAMPLES if neither
// matched. Returns null when nothing matches at all, so the caller can
// redirect rather than render.
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
    return {
      document: editingMatch || awaitingApprovalMatch,
      status: editingMatch ? 'Editing' : 'Awaiting approval'
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
      versionNotes: publishedMatch.versionNotes,
      lastUpdated: publishedMatch.lastUpdated,
      published: publishedMatch.published
    },
    status: 'Published'
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
