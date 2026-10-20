const govukPrototypeKit = require('govuk-prototype-kit')
const { setContentsWidth } = require('../view-model')

// Stores the width the guide's Contents column was dragged (or arrow-keyed)
// to, so the next page renders at it — as panel-width/routes.js does for
// the panel. Posted by side-nav.js with fetch; the value is clamped
// server-side, so a bad one can't break the layout.
const router = govukPrototypeKit.requests.setupRouter(
  '/playground/guide/contents-width'
)

router.post('/', (req, res) => {
  setContentsWidth(req, req.body.width)
  res.sendStatus(204)
})
