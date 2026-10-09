const govukPrototypeKit = require('govuk-prototype-kit')
const { buildSideNav } = require('../../data/side-nav')
const { getPlaygroundApiGuides } = require('../../data/playground-api-guides')

// Sets `sideNav` for every playground page except sign-in (the bare prefix
// and /sign-in), which is what makes layouts/main.html render the side
// navigation shell. Required before any page's own routes.js (see
// app/routes.js), so it runs first. Built at render time, not per request,
// so redirects, image bytes and background POSTs (scroll position, panel
// width) never fetch the API guide list the nav needs.
const router = govukPrototypeKit.requests.setupRouter('/playground')

router.use((req, res, next) => {
  // The header shows the Defra logo only, with no service name.
  res.locals.hideServiceName = true
  const isSignIn = req.path === '/' || /^\/sign-in(\/|$)/.test(req.path)
  if (!isSignIn) {
    const base = req.baseUrl
    const render = res.render
    // Every method, not just GET: a POST that re-renders its page with
    // validation errors (e.g. document/view) still needs the nav.
    res.render = function (...args) {
      getPlaygroundApiGuides(req)
        .then(() => {
          res.locals.sideNav = buildSideNav(req, base)
          render.apply(res, args)
        })
        .catch(next)
    }
  }
  next()
})
