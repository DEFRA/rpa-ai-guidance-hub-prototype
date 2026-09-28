const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/issues/findings'
)

router.get('/', controller.getFindingsStart)
router.get('/:id', controller.getFinding)
router.post('/:id', controller.postFinding)
