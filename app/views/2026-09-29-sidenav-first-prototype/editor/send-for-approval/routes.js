const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/editor/send-for-approval'
)

router.get('/', controller.get)
router.post('/', controller.post)
