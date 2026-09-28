const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

// See ../view/routes.js's own comment (same fix, same underlying kit
// behaviour): :id has to be captured in this router's own path
// (/:id/start-editing), not setupRouter's mount path, or req.params.id is
// always undefined — which, here, meant "Edit" on a Published document
// silently redirected into the editor with no id at all.
const router = govukPrototypeKit.requests.setupRouter('/playground/document')

router.post('/:id/start-editing', controller.post)
