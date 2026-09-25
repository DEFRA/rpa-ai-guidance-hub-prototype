function getUpload(req, res) {
  res.locals.backHref = '/consolidated/hub'
  res.render('consolidated/upload/page.njk')
}

// A new upload is a new guide, so any details left in session from a
// previous run are cleared.
function postUpload(req, res) {
  delete req.session.data.consolidatedUploadedGuide
  res.redirect('/consolidated/upload/processing')
}

module.exports = { getUpload, postUpload }
