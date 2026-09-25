const { buildManageGuidanceRows } = require('../../../data/manage-guidance')

// Retired as its own page — /v6/unified-guidance (app/views/v6/unified-guidance/)
// replaces this and /v6/find-guidance with one screen, four sidebar tabs
// instead of two peer pages. Kept as a redirect, not removed, so existing
// bookmarks/links elsewhere in the app still land somewhere real.
function get(req, res) {
  res.redirect('/v6/unified-guidance')
}

// The search box on all-guidance-docs.html, directly below "Create or
// upload guidance" — a plain GET <form>, so Enter/Search both just submit
// it natively. Matches on document name only (a case-insensitive substring
// match), across both Editing and Awaiting approval — Published is not
// searched either, since it is not shown on this page any more. An empty q
// shows no results rather than matching everything.
function getSearch(req, res) {
  const query = (req.query.q || '').trim()
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)
  const allDocuments = editingDocuments.concat(awaitingApprovalDocuments)

  const results = query
    ? allDocuments.filter((document) =>
        document.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  res.locals.backHref = '/v6/all-guidance-docs'
  res.render('versions/v6/manage-guidance-search', { query, results })
}

module.exports = { get, getSearch }
