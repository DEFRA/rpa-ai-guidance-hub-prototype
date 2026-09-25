const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/issues/findings'
)

router.get('/', controller.getFindingsStart)
router.get('/:id', controller.getFinding)
router.post('/:id', controller.postFinding)
