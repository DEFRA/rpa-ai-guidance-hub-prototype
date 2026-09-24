const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/editor')

router.get('/', controller.get)
router.post('/preview', controller.postPreview)
router.get('/preview', controller.getPreview)
router.post('/reply', controller.postReply)
router.post('/delete', controller.postDelete)
router.post('/add-comment', controller.postAddComment)
router.get('/send-for-approval', controller.getSendForApproval)
router.post('/send-for-approval', controller.postSendForApproval)
