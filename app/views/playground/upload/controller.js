function getUpload(req, res) {
  res.locals.backHref = '/playground/hub'
  res.render('playground/upload/page.njk')
}

// A new upload is a new guide, so any details left in session from a
// previous run are cleared.
function postUpload(req, res) {
  delete req.session.data.playgroundUploadedGuide
  res.redirect('/playground/upload/processing')
}

module.exports = { getUpload, postUpload }
