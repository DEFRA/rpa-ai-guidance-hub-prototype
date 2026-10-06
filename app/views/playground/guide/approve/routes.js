const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// :id is captured in the route path, not the mount path (see
// document/start-editing/routes.js), or req.params.id is undefined.
const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.post('/:id/approve', controller.post)
