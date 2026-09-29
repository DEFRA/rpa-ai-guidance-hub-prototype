const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// Mounted at the static /2026-09-29-sidenav-first-prototype/document prefix, with :id captured in
// this router's own path (/:id/view) rather than baked into setupRouter's
// mount path — setupRouter('/2026-09-29-sidenav-first-prototype/document/:id/view') would look
// right (and is what CLAUDE.md's own nested-route convention describes),
// but the kit builds every router with express.Router() and no
// mergeParams, so a param in the *mount* path never reaches req.params
// inside it. Same fix applies to view/traditional and view/stepper's own
// routes.js, both nested another level below this one.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/document'
)

router.get('/:id/view', controller.get)
router.post('/:id/view', controller.post)
