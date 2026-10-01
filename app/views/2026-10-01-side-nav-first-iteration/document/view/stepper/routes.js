const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// See ../routes.js's own comment: :id has to be captured in this router's
// own path (/:id/view/stepper), not setupRouter's mount path, or
// req.params.id is always undefined.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/document'
)

router.get('/:id/view/stepper', controller.get)
