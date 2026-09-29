const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /2026-09-29-sidenav-first-prototype/ prefix and its own /sign-in path both render the
// same front door.
router.get('/2026-09-29-sidenav-first-prototype/', controller.get)
router.get('/2026-09-29-sidenav-first-prototype/sign-in', controller.get)
router.post('/2026-09-29-sidenav-first-prototype/sign-in', controller.post)
