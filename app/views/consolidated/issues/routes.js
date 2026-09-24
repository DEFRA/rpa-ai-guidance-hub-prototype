const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/issues')

router.get('/', controller.getIssues)

router.get('/findings/:id', controller.getFinding)
router.post('/findings/:id', controller.postFinding)
router.get('/findings', controller.getFindingsStart)

router.get('/review-complete', controller.getReviewComplete)
router.get('/review-reset', controller.getReviewReset)
