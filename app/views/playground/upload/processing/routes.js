const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/upload/processing'
)

router.get('/', (req, res) => {
  res.render('playground/upload/processing/page.njk')
})
