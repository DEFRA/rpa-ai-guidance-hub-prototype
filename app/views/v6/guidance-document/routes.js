const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v6/guidance-document')

router.get('/:id', controller.get)
router.get('/:id/edit', controller.getEdit)
router.get('/:id/review', controller.getReview)
router.get('/:id/review/:issueNumber', controller.getReview)
