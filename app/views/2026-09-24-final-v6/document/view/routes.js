const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// The mount path is deliberately static and the :id lives on the route
// below instead — express.Router() doesn't merge a param matched in its
// own mount path into req.params (that only happens with
// { mergeParams: true }, which setupRouter doesn't set), so putting :id
// in the setupRouter() path here left req.params.id undefined and the
// "Continue" post below redirecting to a paramless URL that 404s back to
// the hub. Same convention document/routes.js's own '/:id' already uses.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-final-v6/document'
)

router.get('/:id/view', controller.get)
router.post('/:id/view', controller.post)
