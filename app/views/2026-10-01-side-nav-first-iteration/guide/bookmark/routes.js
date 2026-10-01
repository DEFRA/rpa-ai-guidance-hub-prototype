const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// :id has to be captured in this router's own path (/:id/bookmark), not
// setupRouter's mount path — see ../../document/view/routes.js's own
// comment for why.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/guide'
)

router.get('/:id/bookmark', controller.get)
router.post('/:id/bookmark', controller.post)
