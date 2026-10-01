const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /2026-10-01-side-nav-first-iteration/ prefix and its own /sign-in path both render the
// same front door.
router.get('/2026-10-01-side-nav-first-iteration/', controller.get)
router.get('/2026-10-01-side-nav-first-iteration/sign-in', controller.get)
router.post('/2026-10-01-side-nav-first-iteration/sign-in', controller.post)
