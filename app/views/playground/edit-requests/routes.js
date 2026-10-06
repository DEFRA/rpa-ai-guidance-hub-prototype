const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/edit-requests'
)

router.get('/', controller.get)
router.post('/:id/approve', controller.postApprove)
