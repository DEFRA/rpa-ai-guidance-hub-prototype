const { CONVERTED_GUIDE_ID } = require('../view-model')

// The success page — reached via the POST-then-GET redirect from /check,
// so refreshing doesn't resubmit.
function get(req, res) {
  const details = req.session.data.playgroundUploadedGuide
  if (!details) return res.redirect('/2026-09-24-final-v6/upload')

  res.render('2026-09-24-final-v6/upload/converted/page.njk', {
    guideName: details.name,
    guideId: CONVERTED_GUIDE_ID
  })
}

module.exports = { get }
