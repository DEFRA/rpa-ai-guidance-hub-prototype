const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-final-v6/issues/findings'
)

router.get('/', controller.getFindingsStart)
router.get('/:id', controller.getFinding)
router.post('/:id', controller.postFinding)
