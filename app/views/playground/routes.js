const govukPrototypeKit = require('govuk-prototype-kit')
const { buildSideNav } = require('../../data/side-nav')
const { getPlaygroundApiGuides } = require('../../data/playground-api-guides')
const { buildPwa, setMode, getOpenIn, getMode } = require('../../data/pwa')
const { documentWindow } = require('./window/middleware')

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
  // Sign-in and the PWA install screen are gates, so neither gets the nav.
  const isSignIn =
    req.path === '/' || /^\/(sign-in|install)(\/|$)/.test(req.path)
  // PWA document windows (window/) get a slim header instead of the nav;
  // window/middleware.js then hands /window/:id to the guide page.
  const isDocumentWindow = /^\/window(\/|$)/.test(req.path)
  const isSettings = /^\/prototype-settings(\/|$)/.test(req.path)

  // The PWA prototype's mode switch: ?pwaMode=a|b on any page is remembered.
  if (typeof req.query.pwaMode === 'string') setMode(req, req.query.pwaMode)
  res.locals.pwa = buildPwa(req, req.baseUrl)

  if (!isSignIn && !isDocumentWindow) {
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
    // Option A's hub only runs in the app (layouts/main.html sends a browser
    // tab to install/). Settings stays reachable for installing and testing.
    res.locals.pwa.requireApp =
      !isSettings && getOpenIn(req) === 'app' && getMode(req) === 'a'
  }
  documentWindow(req, res, next)
})
