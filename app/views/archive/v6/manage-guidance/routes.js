const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v6/manage-guidance')

router.get('/document-overview', controller.getDocumentOverview)
router.post('/start-editing', controller.postStartEditing)
router.get('/remove-confirm', controller.getRemoveConfirm)
router.post('/remove', controller.postRemove)
router.get('/search-guidance', controller.getSearchGuidance)
router.get('/editor-experiment-narrow', controller.getEditorExperimentNarrow)
