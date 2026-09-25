const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/hub/remove'
)

router.post('/', controller.post)
