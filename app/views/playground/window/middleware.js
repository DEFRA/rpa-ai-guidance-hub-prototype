const { docWindowHeader } = require('./view-model')

const GUIDE_VIEW = 'playground/guide/page.njk'

// A PWA document window is the guide page itself (guide/**), served under
// /window/ instead of /guide/ so layouts/main.html gives it the slim header
// and no side nav (`docWindow`). The request is handed to the guide's own
// routes, and every /guide/ URL in the page and its redirects is pointed
// back at /window/, so paging, bookmarking and the panel stay in the window.
// Run from playground/routes.js, ahead of every page's own routes.
function documentWindow(req, res, next) {
  if (/^\/window\/?$/.test(req.path)) {
    // Option B's app home (routes.js).
    res.locals.docWindow = {}
    res.locals.pwa = { ...res.locals.pwa, appHome: true }
    return next()
  }

  const match = req.path.match(/^\/window\/([^/]+)/)
  if (!match || match[1] === 'launch') return next()

  const guidePrefix = `${req.baseUrl}/guide/`
  const windowPrefix = `${req.baseUrl}/window/`
  const toWindow = (value) =>
    value.split(`="${guidePrefix}`).join(`="${windowPrefix}`)

  // Filled in from the guide page's view model at render time (API guides
  // are only known once the guide page has fetched them).
  res.locals.docWindow = {}
  req.url = req.url.replace(/^\/window\//, '/guide/')

  const render = res.render.bind(res)
  res.render = (view, options, callback) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    if (view === GUIDE_VIEW && options && options.document) {
      res.locals.docWindow = docWindowHeader(req, options)
      // pwa.js answers the hub's "is this guide open?" pings with this id.
      res.locals.pwa = { ...res.locals.pwa, docId: options.id }
    }
    render(view, options, (error, html) => {
      if (error) return callback ? callback(error) : next(error)
      if (callback) callback(null, toWindow(html))
      else res.send(toWindow(html))
    })
  }

  const redirect = res.redirect.bind(res)
  res.redirect = (...args) => {
    const last = args.length - 1
    if (typeof args[last] === 'string' && args[last].startsWith(guidePrefix)) {
      args[last] = windowPrefix + args[last].slice(guidePrefix.length)
    }
    redirect(...args)
  }

  next()
}

module.exports = { documentWindow }
