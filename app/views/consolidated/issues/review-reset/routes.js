const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/issues/review-reset'
)

router.get('/', (req, res) => {
  delete req.session.data.verdicts
  res.redirect('/consolidated/issues')
})
