const govukPrototypeKit = require('govuk-prototype-kit')
const { safeReturnTo } = require('../../../data/side-nav')

// Deliberately mounted outside the PWA's /playground/ scope: Chromium opens
// an out-of-scope link from an app window in a browser tab. The page asked
// for is served right here rather than redirected to, because a browser tab
// landing on an in-scope URL can be captured straight back into the app.
// How "Open in browser tab" (both options) and option B's app home leave the
// app (app/data/pwa.js).
const router = govukPrototypeKit.requests.setupRouter('/open-in-browser')

router.get('/', (req, res, next) => {
  const to = safeReturnTo(req.query.to, '/playground/hub')
  if (to.startsWith('/open-in-browser')) {
    res.redirect('/playground/hub')
    return
  }

  // Re-dispatch through the whole app as if `to` had been requested;
  // clearing req.query makes Express re-parse it from the new URL.
  req.url = to
  req.query = null
  req.app.handle(req, res, next)
})
