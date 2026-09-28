const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /2026-09-24-context-pane/ prefix and its own /sign-in path both render the
// same front door.
router.get('/2026-09-24-context-pane/', controller.get)
router.get('/2026-09-24-context-pane/sign-in', controller.get)
router.post('/2026-09-24-context-pane/sign-in', controller.post)
