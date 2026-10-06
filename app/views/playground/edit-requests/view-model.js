const { getEditRequestIds } = require('../../../data/permissions')
const {
  getPlaygroundApiGuides
} = require('../../../data/playground-api-guides')
const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

// Pending "Request permission to edit" requests, one row per guide.
async function fromSession(req) {
  const apiGuides = await getPlaygroundApiGuides(req)
  const requests = getEditRequestIds(req).map((id) => {
    const local = lookupAnyManageGuidanceDocument(id)
    const api = apiGuides.find((guide) => guide.id === id)
    const title = (local && local.title) || (api && api.title) || id
    return {
      id,
      title,
      guideHref: `/playground/guide/${encodeURIComponent(id)}`,
      approveHref: `/playground/edit-requests/${encodeURIComponent(id)}/approve`
    }
  })
  return { requests }
}

module.exports = { fromSession }
