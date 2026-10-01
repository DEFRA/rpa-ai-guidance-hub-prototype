const govukPrototypeKit = require('govuk-prototype-kit')
const { setNavCollapsed, safeReturnTo } = require('../../../../data/side-nav')

// Collapse to the icon rail or expand again — a plain form POST, so it works
// without JavaScript. The rail's Search/Pinned/Case bookmarks buttons submit
// their own returnTo (with a #fragment) as well as the form's hidden one, so
// the last value wins.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/side-nav/toggle'
)

router.post('/', (req, res) => {
  setNavCollapsed(req, req.body.collapsed === 'true')
  res.redirect(safeReturnTo([].concat(req.body.returnTo).pop()))
})
