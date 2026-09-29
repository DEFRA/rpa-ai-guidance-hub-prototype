function getUpload(req, res) {
  res.locals.backHref = '/2026-09-29-sidenav-first-prototype/hub'
  res.render('2026-09-29-sidenav-first-prototype/upload/page.njk')
}

// A new upload is a new guide, so any details left in session from a
// previous run are cleared.
function postUpload(req, res) {
  delete req.session.data.playgroundUploadedGuide
  res.redirect('/2026-09-29-sidenav-first-prototype/upload/processing')
}

module.exports = { getUpload, postUpload }
