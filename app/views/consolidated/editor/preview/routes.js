const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/editor/preview'
)

router.post('/', controller.post)
router.get('/', controller.get)
