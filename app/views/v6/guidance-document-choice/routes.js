const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/v6/guidance-document-choice'
)

router.get('/:id', controller.get)
router.post('/:id', controller.post)
