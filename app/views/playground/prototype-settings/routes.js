const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/prototype-settings'
)

router.get('/', controller.get)
router.post('/', controller.post)
