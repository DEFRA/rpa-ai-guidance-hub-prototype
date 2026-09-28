//
// The loader: walks app/views/playground for routes.js files and requires
// each one, so adding a page module means adding a folder rather than editing
// this file. Every other version (v1-v6, legacy) is frozen/archived and no
// longer wired up here — see CLAUDE.md.
//
// Frozen snapshots (app/views/<snapshot-id>/, each identified by a
// .snapshot.json written by scripts/snapshot.js) are walked the same way, so
// a snapshot stays servable for comparison during research after playground
// has moved on.
//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const { readdirSync, statSync, existsSync } = require('node:fs')
const path = require('node:path')
const govukPrototypeKit = require('govuk-prototype-kit')
const prototypes = require('./lib/prototypes')
const { getPageNotes } = require('./lib/page-notes')

const viewsDir = path.join(__dirname, 'views')
const pagesDir = path.join(viewsDir, 'playground')

// The Notes panel (app/views/partials/notes-panel.njk, rendered on every
// page by layouts/main.html) reads this — previously set by a router.use()
// in app/views/legacy/routes.js, which archiving that version along with
// v1-v6 stopped wiring up at all. Re-homed here, app-wide, rather than
// un-archiving legacy just for this one piece of it: playground and every
// frozen snapshot both still want a working Notes panel even though their
// actual page routes/views are otherwise unrelated to legacy's.
//
// No snapshot-specific handling needed — getPageNotes()/resolveTemplateFile()
// (app/lib/page-notes.js) resolve a plain, non-/vN/ path by trying
// app/views/<that same path>/page.njk, and a snapshot's own page.notes.md
// sits right next to its copied-and-rewritten page.njk at exactly that
// path (see scripts/lib/rewrite-paths.js) — the same lookup that already
// works for playground's own pages works for a snapshot's without any
// extra logic. Registered before the loop below requires any page's own
// routes.js, so this runs ahead of every page-specific router.
govukPrototypeKit.requests.setupRouter().use((req, res, next) => {
  res.locals.pageNotes = getPageNotes(req.path)
  next()
})

// The versions list — app/views/index.html, generated from
// app/data/prototypes.js (via app/lib/prototypes.js's getVersions()). Not a
// playground page itself (it lists every version, playground included),
// so it is registered here rather than picked up by the walk below.
govukPrototypeKit.requests.setupRouter().get('/', (_req, res) => {
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

function snapshotDirs() {
  return readdirSync(viewsDir)
    .map((entry) => path.join(viewsDir, entry))
    .filter(
      (full) =>
        statSync(full).isDirectory() &&
        existsSync(path.join(full, '.snapshot.json'))
    )
}

// A tree's own root routes.js (playground's side-nav middleware) is required
// first so its router.use() runs ahead of every page's routes. The sort is
// stable, so every other file keeps its existing order.
for (const dir of [pagesDir, ...snapshotDirs()]) {
  const rootRoutes = path.join(dir, 'routes.js')
  const files = findRouteFiles(dir).sort(
    (a, b) => (b === rootRoutes) - (a === rootRoutes)
  )
  for (const file of files) require(file)
}

// The kit renders any URL that matches a template, which would serve a page
// with no view model, or a bare layout. Registered after the page modules so
// real routes still win.
govukPrototypeKit.requests
  .setupRouter()
  .get(/(^\/common\/)|(\/page$)/, (req, res) => {
    res.status(404).render('common/layouts/not-found.njk')
  })
