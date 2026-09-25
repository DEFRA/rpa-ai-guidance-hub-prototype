const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/document/:id/start-editing'
)

router.post('/', controller.post)
