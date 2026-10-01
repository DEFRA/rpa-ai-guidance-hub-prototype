const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/issues/review-reset'
)

router.get('/', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/2026-10-01-side-nav-first-iteration/issues')
})
