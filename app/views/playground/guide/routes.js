const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

// Before every other route here: a mock copy's address goes to its real guide.
router.get(['/:id', '/:id/*'], controller.redirectMockCopy)

router.get('/:id/assets/:assetId', controller.getAsset)
router.get('/:id/quality-check', controller.getQualityCheck)
router.get('/:id', controller.get)
