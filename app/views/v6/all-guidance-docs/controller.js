const { buildManageGuidanceRows } = require('../../../data/manage-guidance')

// No backHref — all-guidance-docs.html shows breadcrumbs instead of a Back
// link now (see the template).
function get(req, res) {
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  res.render('versions/v6/all-guidance-docs', {
    editingDocuments,
    awaitingApprovalDocuments
  })
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
