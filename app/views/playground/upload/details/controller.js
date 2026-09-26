const {
  V4_SCHEME_VALUES,
  UPLOAD_VERSION,
  UPLOAD_LAST_MODIFIED,
  selected,
  uploadedGuide
} = require('../view-model')

// Step 1 of 2 — the facts read from the document plus the scheme(s) this
// guidance relates to. Reachable via a Change link from the check page
// (?from=check), carried through as a hidden field so Continue returns
// there instead of carrying on.
function get(req, res) {
  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check' ? '/playground/upload/check' : '/playground/upload'
  res.render('playground/upload/details/page.njk', {
    details: uploadedGuide(req),
    errors: {},
    errorList: [],
    from
  })
}

function post(req, res) {
  const title = (req.body.guideTitle || '').trim()
  const scheme = selected(req.body.scheme, V4_SCHEME_VALUES)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!title) {
    errors.guideTitle = { text: 'Enter a guidance title', href: '#guide-title' }
  }
  if (!scheme.length) {
    errors.scheme = {
      text: "Select the scheme or schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  } else if (scheme.includes('none') && scheme.length > 1) {
    errors.scheme = {
      text: "Select the schemes this guidance relates to, or select 'Not scheme-specific'",
      href: '#scheme'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check' ? '/playground/upload/check' : '/playground/upload'
    return res.render('playground/upload/details/page.njk', {
      details: Object.assign({}, uploadedGuide(req), { name: title, scheme }),
      errors,
      errorList: Object.values(errors),
      from
    })
  }

  const details = uploadedGuide(req)
  details.name = title
  details.version = UPLOAD_VERSION
  details.lastModified = UPLOAD_LAST_MODIFIED
  details.scheme = scheme
  req.session.data.playgroundUploadedGuide = details

  res.redirect(
    from === 'check' ? '/playground/upload/check' : '/playground/upload/owner'
  )
}

module.exports = { get, post }
