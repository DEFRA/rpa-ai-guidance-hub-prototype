const govukPrototypeKit = require('govuk-prototype-kit')
const { setBookmarkOrder, safeReturnTo } = require('../../../../data/side-nav')

// Reorders the side nav's case bookmarks: `order` is every case's
// "type:ref", comma separated. Posted by side-nav.js with fetch after a drag
// (no returnTo, so 204), or by a Move up / Move down form in the case's "…"
// menu.
const router = govukPrototypeKit.requests.setupRouter(
  '/playground/case-bookmarks/order'
)

router.post('/', (req, res) => {
  const order = typeof req.body.order === 'string' ? req.body.order : ''
  setBookmarkOrder(req, order.split(',').filter(Boolean))
  if (!req.body.returnTo) {
    res.sendStatus(204)
    return
  }
  res.redirect(
    `${safeReturnTo(req.body.returnTo).split('#')[0]}#side-nav-cases`
  )
})
