const govukPrototypeKit = require('govuk-prototype-kit')
const { setRole, safeReturnTo } = require('../../../data/side-nav')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/switch-role'
)

// The side nav's role switcher (partials/side-nav.njk) — a research-
// facilitator convenience, not part of any journey being prototyped. POST
// only: this changes session state, so a GET link would let a bookmark or
// back-button replay flip the role as a side effect.
router.post('/', (req, res) => {
  setRole(req, req.body.role)
  res.redirect(safeReturnTo(req.body.returnTo))
})
