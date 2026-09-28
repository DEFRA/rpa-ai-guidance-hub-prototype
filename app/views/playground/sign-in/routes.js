const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter()

// The bare /playground/ prefix and its own /sign-in path both render the
// same front door.
router.get('/playground/', controller.get)
router.get('/playground/sign-in', controller.get)
router.post('/playground/sign-in', controller.post)
