const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/issues/review-complete'
)

router.get('/', (req, res) => {
  res.render(
    '2026-09-29-sidenav-first-prototype/issues/review-complete/page.njk'
  )
})
