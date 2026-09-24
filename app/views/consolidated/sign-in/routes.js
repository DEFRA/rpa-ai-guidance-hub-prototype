const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /consolidated/ prefix and its own /sign-in path both render the
// same front door.
function get(req, res) {
  res.render('consolidated/sign-in/page.njk')
}

router.get('/consolidated/', get)
router.get('/consolidated/sign-in', get)
