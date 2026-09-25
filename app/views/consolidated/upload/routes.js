const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/upload')

router.get('/', controller.getUpload)
router.post('/', controller.postUpload)
