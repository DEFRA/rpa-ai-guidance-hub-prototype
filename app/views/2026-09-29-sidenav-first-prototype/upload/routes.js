const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/upload'
)

router.get('/', controller.getUpload)
router.post('/', controller.postUpload)
