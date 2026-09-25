const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/issues/review-complete'
)

router.get('/', (req, res) => {
  res.render('consolidated/issues/review-complete/page.njk')
})
