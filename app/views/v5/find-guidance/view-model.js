const {
  buildFindGuidanceRows,
  getRecentlyOpened,
  getSavedGuidance
} = require('../../../data/guidance-lists')

// Both tabs' rows are session-backed lists of { id, lastModified } — see
// app/data/guidance-lists.js for the seeding/capping/update rules — each
// looked up in app/data/guidance-documents.js for its title/version.
function fromSession(req) {
  return {
    recentlyOpenedDocuments: buildFindGuidanceRows(getRecentlyOpened(req)),
    savedGuidanceDocuments: buildFindGuidanceRows(getSavedGuidance(req))
  }
}

module.exports = { fromSession }
