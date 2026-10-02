const govukPrototypeKit = require('govuk-prototype-kit')
const { setReadingWidth } = require('../view-model')
const { safeReturnTo } = require('../../../../data/side-nav')

// Saves the reader's chosen page width (Standard, Wide, Full width) — a
// plain form POST from partials/reading-width.njk, so it works without
// JavaScript, the same convention as panel-toggle/routes.js.
const router = govukPrototypeKit.requests.setupRouter(
  '/playground/guide/reading-width'
)

router.post('/', (req, res) => {
  setReadingWidth(req, req.body.width)
  res.redirect(safeReturnTo(req.body.returnTo))
})
