const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/guide'
)

router.get('/:id/assets/:assetId', controller.getAsset)
router.get('/:id', controller.get)
