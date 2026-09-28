const {
  V4_AUDIENCE,
  V4_SYSTEMS,
  EMAIL_RE,
  selected,
  uploadedGuide
} = require('../view-model')

// Step 2 of 2 — owner, purpose, required knowledge/training, systems, and
// who it is for. A direct visit with no upload started yet falls back to
// the details step.
function get(req, res) {
  if (!req.session.data.playgroundUploadedGuide) {
    return res.redirect('/playground/upload/details')
  }

  const from = req.query.from === 'check' ? 'check' : ''
  res.locals.backHref =
    from === 'check' ? '/playground/upload/check' : '/playground/upload/details'
  res.render('playground/upload/owner/page.njk', {
    details: req.session.data.playgroundUploadedGuide,
    errors: {},
    errorList: [],
    from
  })
}

function post(req, res) {
  const owner = (req.body.owner || '').trim()
  const goal = (req.body.goal || '').trim()
  const requirements = (req.body.requirements || '').trim()
  const systems = selected(req.body.systems, V4_SYSTEMS)
  const audience = selected(req.body.audience, V4_AUDIENCE)
  const from = req.body.from === 'check' ? 'check' : ''

  const errors = {}
  if (!owner) {
    errors.owner = { text: 'Enter the owner email address', href: '#owner' }
  } else if (!EMAIL_RE.test(owner)) {
    errors.owner = {
      text: 'Enter an email address in the correct format, like name@example.com',
      href: '#owner'
    }
  }
  if (!goal) {
    errors.goal = { text: 'Enter the purpose of this guidance', href: '#goal' }
  }
  if (!requirements) {
    errors.requirements = {
      text: 'Enter the required knowledge and training',
      href: '#requirements'
    }
  }
  if (!systems.length) {
    errors.systems = {
      text: 'Select the systems this guidance will use',
      href: '#systems'
    }
  }
  if (!audience.length) {
    errors.audience = {
      text: 'Select who this guidance is for',
      href: '#audience'
    }
  }

  if (Object.keys(errors).length) {
    res.locals.backHref =
      from === 'check'
        ? '/playground/upload/check'
        : '/playground/upload/details'
    return res.render('playground/upload/owner/page.njk', {
      details: Object.assign({}, uploadedGuide(req), {
        owner,
        goal,
        requirements,
        systems,
        audience
      }),
      errors,
      errorList: Object.values(errors),
      from
    })
  }

  const details = uploadedGuide(req)
  details.owner = owner
  details.goal = goal
  details.requirements = requirements
  details.systems = systems
  details.audience = audience
  req.session.data.playgroundUploadedGuide = details

  res.redirect('/playground/upload/check')
}

module.exports = { get, post }
