const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/issues/review-complete'
)

router.get('/', (req, res) => {
  res.render('2026-09-24-context-pane/issues/review-complete/page.njk')
})
