const { documentOverviewViewModel } = require('./view-model')

// Superseded by the merged guide page (2026-10-01-side-nav-first-iteration/guide/**) — the
// consolidation's "collapse hub -> guide to one click" goal folded this
// page's version switcher and case bookmark straight into the guide page
// itself. Kept as a redirect, not removed, since research links/bookmarks
// to /2026-10-01-side-nav-first-iteration/document/:id shouldn't break — see page.notes.md.
function get(req, res) {
  const exists = documentOverviewViewModel(req, req.params.id)

  if (!exists) {
    res.redirect('/2026-10-01-side-nav-first-iteration/hub')
    return
  }

  res.redirect(
    '/2026-10-01-side-nav-first-iteration/guide/' +
      encodeURIComponent(req.params.id)
  )
}

module.exports = { get }
