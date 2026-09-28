const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// One module, one router, every step of the "what would you like to do?"
// + upload journey — the same granularity app/views/v6/find-guidance/
// already uses for its own multi-step sub-flow (/new, /organic-search,
// /ai-search, ...), not a separate top-level module per step.
//
// The upload journey itself (upload → processing → metadata →
// metadata/purpose → check → converted) is a v6 port of v4's own
// /v4/upload-guide/* flow (app/views/versions/v4/upload-*.html,
// app/views/legacy/routes.js) — duplicated, not shared/redirected-into:
// v4 is frozen, and its own converted.html hardcodes links
// (/v4/upload-guide/view, /v4/upload-guide) this flow cannot end on
// without breaking the "view/edit in draft state" requirement it was
// built to. See controller.js's own top comment for the rest of what
// differs from v4.
const router = govukPrototypeKit.requests.setupRouter('/v6/create-guidance')

router.get('/', controller.get)
router.post('/', controller.post)

router.get('/upload', controller.getUpload)
router.post('/upload', controller.postUpload)

router.get('/processing', controller.getProcessing)

router.get('/metadata', controller.getMetadata)
router.post('/metadata', controller.postMetadata)

router.get('/metadata/purpose', controller.getMetadataPurpose)
router.post('/metadata/purpose', controller.postMetadataPurpose)

router.get('/check', controller.getCheck)
router.post('/check', controller.postCheck)

router.get('/converted', controller.getConverted)
