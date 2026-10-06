const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/playground/issues')

router.get('/:guideId/findings', controller.getFindingsStart)
router.get('/:guideId/findings/:id', controller.getFinding)
router.post('/:guideId/findings/:id', controller.postFinding)
