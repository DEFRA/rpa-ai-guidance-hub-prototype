const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v6/editor-experiment')

router.get('/', controller.get)
router.post('/preview', controller.postPreview)
router.get('/preview', controller.getPreview)
router.post('/reply', controller.postReply)
router.post('/delete', controller.postDelete)
router.post('/add-comment', controller.postAddComment)
