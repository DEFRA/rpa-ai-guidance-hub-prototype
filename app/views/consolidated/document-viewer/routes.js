const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/document')

router.get('/:id/view', controller.getChoice)
router.post('/:id/view', controller.postChoice)
router.get('/:id/view/stepper', controller.getStepper)
router.get('/:id/view/traditional', controller.getTraditional)
