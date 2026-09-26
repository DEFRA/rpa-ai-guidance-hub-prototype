const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/document/:id/start-editing'
)

router.post('/', controller.post)
