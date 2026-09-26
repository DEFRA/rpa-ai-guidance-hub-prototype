const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/issues/review-complete'
)

router.get('/', (req, res) => {
  res.render('playground/issues/review-complete/page.njk')
})
