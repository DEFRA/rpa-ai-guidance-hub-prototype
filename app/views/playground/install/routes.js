const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter('/playground/install')

router.get('/', (req, res) => res.render('playground/install/page.njk'))
