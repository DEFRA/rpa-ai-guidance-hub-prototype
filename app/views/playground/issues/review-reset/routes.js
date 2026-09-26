const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/issues/review-reset'
)

router.get('/', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/playground/issues')
})
