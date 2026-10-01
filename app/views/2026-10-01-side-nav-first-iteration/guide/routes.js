const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/guide'
)

router.get('/:id/assets/:assetId', controller.getAsset)
router.get('/:id', controller.get)
