//
// The loader: walks app/views/consolidated for routes.js files and requires
// each one, so adding a page module means adding a folder rather than editing
// this file. Every other version (v1-v6, legacy) is frozen/archived and no
// longer wired up here — see CLAUDE.md.
//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const { readdirSync, statSync } = require('node:fs')
const path = require('node:path')
const govukPrototypeKit = require('govuk-prototype-kit')
const prototypes = require('./lib/prototypes')

const pagesDir = path.join(__dirname, 'views', 'consolidated')

// The versions list — app/views/index.html, generated from
// app/data/prototypes.js (via app/lib/prototypes.js's getVersions()). Not a
// consolidated page itself (it lists every version, consolidated included),
// so it is registered here rather than picked up by the walk below.
govukPrototypeKit.requests
  .setupRouter()
  .get('/', (_req, res) => {
    res.render('index', { versions: prototypes.getVersions() })
  })

function findRouteFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)

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
