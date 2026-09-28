const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// :id lives on the route, not the mount path — see view/routes.js's own
// comment for why.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-final-v6/document'
)

router.get('/:id/view/traditional', controller.get)
