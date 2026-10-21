const govukPrototypeKit = require('govuk-prototype-kit')
const { setPinOrder, safeReturnTo } = require('../../../data/side-nav')

// Reorders the side nav's pinned guides: `order` is every pin's id, comma
// separated. Posted by side-nav.js with fetch after a drag (no returnTo, so
// 204), or by a Move up / Move down form in the pin's "…" menu.
const router = govukPrototypeKit.requests.setupRouter('/playground/pin-order')

router.post('/', (req, res) => {
  const order = typeof req.body.order === 'string' ? req.body.order : ''
  setPinOrder(req, order.split(',').filter(Boolean))
  if (!req.body.returnTo) {
    res.sendStatus(204)
    return
  }
  res.redirect(
    `${safeReturnTo(req.body.returnTo).split('#')[0]}#side-nav-pinned`
  )
})
