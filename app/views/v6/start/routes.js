const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter('/v6/start')

router.get('/', (req, res) => {
  // Starting fresh clears any variant left over from a previous run.
  delete req.session.data.activeJourney
  res.render('versions/v6/start')
})
