const govukPrototypeKit = require('govuk-prototype-kit')
const { togglePin, safeReturnTo } = require('../../../data/side-nav')

// Pin or unpin a guide — from the star on a hub result, the Pin button on a
// document page, or Unpin in the side nav's "…" menu. The hub's star sends
// an anchor (its own button id) so the reader keeps their place in the list.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-29-sidenav-first-prototype/pin-toggle'
)

router.post('/', (req, res) => {
  const id = req.body.documentId
  if (id) togglePin(req, id)
  const returnTo = safeReturnTo(req.body.returnTo)
  const anchor = /^[\w-]+$/.test(req.body.anchor || '')
    ? `#${req.body.anchor}`
    : ''
  res.redirect(returnTo.split('#')[0] + anchor)
})
