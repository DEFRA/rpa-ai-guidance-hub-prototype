const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// The v6 editor entry point — see controller.js's own top comment for why
// this now has full feature parity with app/views/v6/editor-experiment/
// (?id=-driven content, Preview, comments/replies/deletes) rather than
// the earlier bare "always render the fixed sample" wiring.
const router = govukPrototypeKit.requests.setupRouter('/v6/editor-2-3-view')

router.get('/', controller.get)
router.post('/preview', controller.postPreview)
router.get('/preview', controller.getPreview)
router.post('/reply', controller.postReply)
router.post('/delete', controller.postDelete)
router.post('/add-comment', controller.postAddComment)
router.get('/send-for-approval', controller.getSendForApproval)
router.post('/send-for-approval', controller.postSendForApproval)
