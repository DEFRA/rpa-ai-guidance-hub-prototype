const govukPrototypeKit = require('govuk-prototype-kit')
const { setPanelWidth } = require('../view-model')

// Stores the width the guide panel was dragged (or arrow-keyed) to, so the
// next page renders at it — the guide's own mirror of
// side-nav/width/routes.js. Posted by side-nav.js with fetch; the value is
// clamped server-side, so a bad one can't break the layout.
const router = govukPrototypeKit.requests.setupRouter(
  '/playground/guide/panel-width'
)

router.post('/', (req, res) => {
  setPanelWidth(req, req.body.width)
  res.sendStatus(204)
})
