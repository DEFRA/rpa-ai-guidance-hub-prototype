const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/hub/remove'
)

router.post('/', controller.post)
