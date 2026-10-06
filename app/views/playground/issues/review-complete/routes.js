const govukPrototypeKit = require('govuk-prototype-kit')
const { issuesViewModel } = require('../view-model')

const router = govukPrototypeKit.requests.setupRouter('/playground/issues')

router.get('/:id/review-complete', (req, res) => {
  res.render(
    'playground/issues/review-complete/page.njk',
    issuesViewModel(req, req.params.id)
  )
})
