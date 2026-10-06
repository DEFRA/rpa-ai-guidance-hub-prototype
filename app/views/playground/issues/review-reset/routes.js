const govukPrototypeKit = require('govuk-prototype-kit')
const { issuesBase } = require('../view-model')

const router = govukPrototypeKit.requests.setupRouter('/playground/issues')

router.get('/:id/review-reset', (req, res) => {
  delete req.session.data.verdicts
  res.redirect(issuesBase(req.params.id))
})
