const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/editor/preview'
)

router.post('/', controller.post)
router.get('/', controller.get)
