const { CONVERTED_GUIDE_ID } = require('../view-model')

// The success page — reached via the POST-then-GET redirect from /check,
// so refreshing doesn't resubmit.
function get(req, res) {
  const details = req.session.data.consolidatedUploadedGuide
  if (!details) return res.redirect('/consolidated/upload')

  res.render('consolidated/upload/converted/page.njk', {
    guideName: details.name,
    guideId: CONVERTED_GUIDE_ID
  })
}

module.exports = { get }
