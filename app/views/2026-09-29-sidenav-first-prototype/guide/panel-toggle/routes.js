const govukPrototypeKit = require('govuk-prototype-kit')
const { setPanelCollapsed } = require('../view-model')
const { safeReturnTo } = require('../../../../data/side-nav')

// Collapse the guide page's own right-hand panel to its icon rail, or
// expand it again — a plain form POST, so it works without JavaScript.
// Same convention as the side nav's own toggle (side-nav/toggle/routes.js):
// the collapsed rail's own buttons submit their own returnTo (with a
// #fragment) as well as the form's hidden one, so the last value wins.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/guide/panel-toggle'
)

router.post('/', (req, res) => {
  setPanelCollapsed(req, req.body.collapsed === 'true')
  res.redirect(safeReturnTo([].concat(req.body.returnTo).pop()))
})
