const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/upload/details'
)

router.get('/', controller.get)
router.post('/', controller.post)
