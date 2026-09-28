const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-final-v6/document'
)

router.get('/:id', controller.get)
