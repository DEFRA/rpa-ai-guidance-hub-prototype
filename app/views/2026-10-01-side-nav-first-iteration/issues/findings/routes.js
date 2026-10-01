const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/issues/findings'
)

router.get('/', controller.getFindingsStart)
router.get('/:id', controller.getFinding)
router.post('/:id', controller.postFinding)
