const govukPrototypeKit = require('govuk-prototype-kit')
const { setNavWidth } = require('../../../../data/side-nav')

// Stores the width the nav was dragged (or arrow-keyed) to, so the next page
// renders at it. Posted by side-nav.js with fetch; the value is clamped
// server-side, so a bad one can't break the layout.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/side-nav/width'
)

router.post('/', (req, res) => {
  setNavWidth(req, req.body.width)
  res.sendStatus(204)
})
