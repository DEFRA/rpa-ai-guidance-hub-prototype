const govukPrototypeKit = require('govuk-prototype-kit')
const { setPaneCollapsed } = require('../../../data/context-pane')

// The context pane's own Hide/Show controls (see
// app/views/partials/context-pane.njk and context-pane-trigger.njk) — a
// real <form method="post"> round-trip, not a JS-driven toggle, so it
// works with JavaScript off: req.body.collapsed already carries the
// value the form wants (the opposite of however the pane is currently
// showing, computed server-side when that form was rendered), so this
// route only ever needs to store it and redirect back.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-context-pane/context-pane-toggle'
)

router.post('/', (req, res) => {
  setPaneCollapsed(req, req.body.collapsed === 'true')
  res.redirect(req.body.returnTo || '/2026-09-24-context-pane/hub')
})
