const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /2026-09-24-final-v6/ prefix and its own /sign-in path both render the
// same front door.
function get(req, res) {
  res.render('2026-09-24-final-v6/sign-in/page.njk')
}

router.get('/2026-09-24-final-v6/', get)
router.get('/2026-09-24-final-v6/sign-in', get)
