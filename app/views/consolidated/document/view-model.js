const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  buildManageGuidanceRows,
  MANAGE_GUIDANCE_PUBLISHED_SAMPLES,
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

// One canonical "Document overview" page, merging what were three separate
// implementations the consolidation plan's crawl found (/v6/document-
// overview/:id — Published documents reached from Recently opened/Saved
// guidance; /v6/manage-guidance/document-overview?id= — Draft/Awaiting
// approval documents, plus a Published state of its own for a sample
// moved there; and /v5/manage-guidance/document-overview, an earlier,
// simpler version of the same idea). This keeps the v6 manage-guidance
// version's three-state model (it was the superset: the other two didn't
// have all three) as the one page every "View"/document link across the
// consolidated build now points at, keyed by id alone rather than a
// separate query-param page per source.
//
// Looked up in the same order buildManageGuidanceRows/
// lookupAnyManageGuidanceDocument already establish: Editing, then
// Awaiting approval, then the manage-guidance-only Published samples,
// then plain guidanceDocuments (the find-guidance side's own Published
// documents) — falling back to null only when nothing matches at all, so
// the caller can 404/redirect rather than render.
function documentOverviewViewModel(req, id) {
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  const editingMatch = editingDocuments.find((candidate) => candidate.id === id)
  const awaitingApprovalMatch = awaitingApprovalDocuments.find(
    (candidate) => candidate.id === id
  )

  if (editingMatch || awaitingApprovalMatch) {
    const row = editingMatch || awaitingApprovalMatch
    const fullDocument = lookupAnyManageGuidanceDocument(row.id)

    return {
      document: {
        ...row,
        versions: fullDocument.versions,
        description: fullDocument.description
      },
      status: editingMatch ? 'Draft' : 'Awaiting approval',
      defaultVersionKey: row.version === 'Version 1' ? 'version1' : 'version2',
      versionsJson: JSON.stringify(fullDocument.versions)
    }
  }

  const publishedSample = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find(
    (candidate) => candidate.id === id
  )
  if (publishedSample) {
    return {
      document: {
        id: publishedSample.id,
        name: publishedSample.title,
        version: publishedSample.version,
        versions: publishedSample.versions,
        description: publishedSample.description
      },
      status: 'Published',
      defaultVersionKey:
        publishedSample.version === 'Version 1' ? 'version1' : 'version2',
      versionsJson: JSON.stringify(publishedSample.versions)
    }
  }

  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === id
  )
  if (!guidanceDocument) return null

  return {
    document: {
      id: guidanceDocument.id,
      name: guidanceDocument.title,
      version: guidanceDocument.version,
      versions: guidanceDocument.versions,
      description: guidanceDocument.description
    },
    status: 'Published',
    defaultVersionKey:
      guidanceDocument.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(guidanceDocument.versions)
  }
}

module.exports = { documentOverviewViewModel }
