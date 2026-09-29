// Superseded by the merged guide page (2026-09-29-sidenav-first-prototype/guide/**), which folds
// the traditional layout into itself as one of the two in-page formats
// rather than its own screen — see guide/page.notes.md. Kept as a
// redirect so old links/bookmarks to this page keep working.
function get(req, res) {
  res.redirect(
    '/2026-09-29-sidenav-first-prototype/guide/' +
      encodeURIComponent(req.params.id) +
      '?format=traditional'
  )
}

module.exports = { get }
