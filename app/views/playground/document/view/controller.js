// Superseded by the merged guide page (playground/guide/**) — the
// consolidation plan's design goals folded the stepper-vs-traditional
// choice into an in-page toggle on the guide page itself, rather than a
// screen everyone has to click through first (see guide/page.notes.md).
// Kept as a redirect so old links/bookmarks to this page keep working.
function get(req, res) {
  res.redirect('/playground/guide/' + encodeURIComponent(req.params.id))
}

function post(req, res) {
  get(req, res)
}

module.exports = { get, post }
