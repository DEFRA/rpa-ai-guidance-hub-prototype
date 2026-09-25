const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/consolidated/editor/add-comment'
)

router.post('/', controller.post)
