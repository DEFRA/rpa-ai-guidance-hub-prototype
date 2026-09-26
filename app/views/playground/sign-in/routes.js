const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /playground/ prefix and its own /sign-in path both render the
// same front door.
function get(req, res) {
  res.render('playground/sign-in/page.njk')
}

router.get('/playground/', get)
router.get('/playground/sign-in', get)
