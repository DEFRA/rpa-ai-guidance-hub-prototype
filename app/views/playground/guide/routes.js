const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.get('/:id/assets/:assetId', controller.getAsset)
router.get('/:id', controller.get)
