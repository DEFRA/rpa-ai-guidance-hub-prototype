const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/issues/review-reset'
)

router.get('/', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/2026-09-24-context-pane/issues')
})
