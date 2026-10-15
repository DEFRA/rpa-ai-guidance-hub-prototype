const {
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')

// The slim header's title and status line (partials/doc-window-header.njk),
// shaped from the guide page's own view model so local and API guides
// (slug ids, fetched by the guide page) both get one.
function docWindowHeader(req, guide) {
  // The hub's summary row, for the category (local guides only). The state
  // comes from the guide page itself (guide-lifecycle.js), not this row.
  const summary =
    buildManageGuidanceSearchResults(req, '').find(
      (document) => document.id === guide.id
    ) || {}
  const lastUpdated =
    (guide.currentVersion && guide.currentVersion.lastUpdated) ||
    summary.lastUpdated

  return {
    title: guide.document.name,
    statusLine: [
      guide.status,
      guide.version,
      lastUpdated ? `Updated ${lastUpdated}` : null,
      summary.category
    ].filter(Boolean)
  }
}

module.exports = { docWindowHeader }
