const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter('/v6/sign-in')

router.get('/', (req, res) => {
  res.render('versions/v6/sign-in')
})
