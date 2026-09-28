const govukPrototypeKit = require('govuk-prototype-kit')
const { buildSideNav } = require('../../data/side-nav')

// Sets `sideNav` for every playground page except sign-in (the bare prefix
// and /sign-in), which is what makes layouts/main.html render the side
// navigation shell. Required before any page's own routes.js (see
// app/routes.js), so it runs first.
const router = govukPrototypeKit.requests.setupRouter('/playground')

router.use((req, res, next) => {
  const isSignIn = req.path === '/' || /^\/sign-in(\/|$)/.test(req.path)
  // Every method, not just GET: a POST that re-renders its page with
  // validation errors (e.g. document/view) still needs the nav.
  if (!isSignIn) {
    res.locals.sideNav = buildSideNav(req, req.baseUrl)
  }
  next()
})
