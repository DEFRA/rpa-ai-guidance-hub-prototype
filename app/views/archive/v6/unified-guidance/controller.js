const viewModel = require('./view-model')

// The v6 main entry point — replaces the old two-page split between
// /v6/find-guidance (Recently opened/Saved guidance) and
// /v6/all-guidance-docs (Editing/Awaiting approval), now one screen with
// all four as sidebar tabs. Both old routes redirect here (see their own
// controllers) rather than being removed, so old links/bookmarks still
// land somewhere real.
function get(req, res) {
  res.render('v6/unified-guidance/page.njk', viewModel.fromSession(req))
}

module.exports = { get }
