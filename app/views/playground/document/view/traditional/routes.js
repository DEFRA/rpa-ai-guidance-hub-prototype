const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// See view/routes.js's own comment: :id has to be captured in this
// router's own path (/:id/view/traditional), not setupRouter's mount
// path, or req.params.id is always undefined.
const router = govukPrototypeKit.requests.setupRouter('/playground/document')

router.get('/:id/view/traditional', controller.get)
