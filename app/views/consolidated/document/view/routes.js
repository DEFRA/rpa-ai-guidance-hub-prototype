const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/document/:id/view'
)

router.get('/', controller.get)
router.post('/', controller.post)
