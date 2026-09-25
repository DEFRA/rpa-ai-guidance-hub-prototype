const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/upload/processing'
)

router.get('/', (req, res) => {
  res.render('consolidated/upload/processing/page.njk')
})
