const { V4_SCHEMES, V4_AUDIENCE, V4_SYSTEMS } = require('../view-model')

// The check page before converting — everything on two summary cards,
// with Change links back to whichever step owns those fields.
function get(req, res) {
  const details = req.session.data.consolidatedUploadedGuide
  if (!details) return res.redirect('/consolidated/upload')

  const listOr = (values, labels, fallback) => {
    const named = (values || []).map((value) => labels[value]).filter(Boolean)
    return named.length ? named.join(', ') : fallback
  }

  res.locals.backHref = '/consolidated/upload/owner'
  res.render('consolidated/upload/check/page.njk', {
    details,
    schemeLabel: listOr(details.scheme, V4_SCHEMES, 'Not scheme-specific'),
    audienceLabel: listOr(details.audience, V4_AUDIENCE, 'Not provided'),
    systemsLabel: listOr(details.systems, V4_SYSTEMS, 'None')
  })
}

function post(req, res) {
  res.redirect('/consolidated/upload/converted')
}

module.exports = { get, post }
