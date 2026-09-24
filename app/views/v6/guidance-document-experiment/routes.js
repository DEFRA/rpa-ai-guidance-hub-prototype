const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/v6/guidance-document-experiment'
)

router.get('/:id', controller.get)
