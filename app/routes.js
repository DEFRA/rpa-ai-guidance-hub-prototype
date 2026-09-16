//
// The loader: walks app/views for routes.js files and requires each one, so
// adding a page module means adding a folder rather than editing this file.
//
// app/views/legacy/routes.js is required first, and explicitly, rather than
// picked up by the walk below like everything else. It carries the site-wide
// middleware (navigation, per-version header state, the journey/quality-check
// locals every not-yet-migrated route still relies on) at its own top level,
// so it has to run before any page module's routes are registered — the walk
// below has no guaranteed order otherwise (see
// references/page-module-architecture.md's "Load order" note).
//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const { readdirSync, statSync } = require('fs')
const path = require('path')
const govukPrototypeKit = require('govuk-prototype-kit')

const pagesDir = path.join(__dirname, 'views')
const legacyDir = path.join(pagesDir, 'legacy')

require(path.join(legacyDir, 'routes.js'))

function findRouteFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (full === legacyDir) continue
    if (statSync(full).isDirectory()) findRouteFiles(full, found)
    else if (entry === 'routes.js') found.push(full)
  }
  return found
}

for (const file of findRouteFiles(pagesDir)) require(file)

// The kit renders any URL that matches a template, which would serve a page
// with no view model, or a bare layout. Registered after the page modules so
// real routes still win.
govukPrototypeKit.requests
  .setupRouter()
  .get(/(^\/common\/)|(\/page$)/, (req, res) => {
    res.status(404).render('common/layouts/not-found.njk')
  })
