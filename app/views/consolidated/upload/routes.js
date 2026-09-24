const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/upload')

router.get('/', controller.getUpload)
router.post('/', controller.postUpload)

router.get('/processing', controller.getProcessing)

router.get('/details', controller.getDetails)
router.post('/details', controller.postDetails)

router.get('/owner', controller.getOwner)
router.post('/owner', controller.postOwner)

router.get('/check', controller.getCheck)
router.post('/check', controller.postCheck)

router.get('/converted', controller.getConverted)
