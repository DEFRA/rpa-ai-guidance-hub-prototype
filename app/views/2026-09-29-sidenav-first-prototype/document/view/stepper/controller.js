// Superseded by the merged guide page (2026-09-29-sidenav-first-prototype/guide/**), which folds
// the stepper into itself as one of the two in-page formats rather than
// its own screen — see guide/page.notes.md. Kept as a redirect (?step= is
// carried over, since the guide page reads that same query param) so old
// links/bookmarks to this page keep working.
function get(req, res) {
  const params = new URLSearchParams({ format: 'stepper' })
  if (req.query.step) params.set('step', req.query.step)

  res.redirect(
    '/2026-09-29-sidenav-first-prototype/guide/' +
      encodeURIComponent(req.params.id) +
      '?' +
      params.toString()
  )
}

module.exports = { get }
