const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/issues/review-reset'
)

router.get('/', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/2026-09-29-sidenav-first-prototype/issues')
})
