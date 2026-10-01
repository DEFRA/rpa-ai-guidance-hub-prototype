const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/upload/processing'
)

router.get('/', (req, res) => {
  res.render('2026-10-01-side-nav-first-iteration/upload/processing/page.njk')
})
