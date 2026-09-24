const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/consolidated/hub')

router.get('/', controller.get)
router.get('/remove-confirm', controller.getRemoveConfirm)
router.post('/remove', controller.postRemove)
router.post('/save-to-search', controller.postSaveToSearch)
router.get('/search', controller.getSearch)
