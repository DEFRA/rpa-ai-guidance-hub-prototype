const govukPrototypeKit = require('govuk-prototype-kit')
const { setRole } = require('../../../data/context-pane')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/switch-role'
)

// The context pane's own "Switch to designer/viewer" control (see
// app/views/partials/context-pane.njk) — a research-facilitator
// convenience, not part of any journey being prototyped. POST only: this
// changes session state, so a GET link would let a bookmark or back-button
// replay flip the role as a side effect.
router.post('/', (req, res) => {
  setRole(req, req.body.role)
  res.redirect(req.body.returnTo || '/2026-09-24-context-pane/hub')
})
