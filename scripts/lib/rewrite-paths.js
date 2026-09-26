//
// After copying app/views/playground/ into a new snapshot directory, every
// router prefix (setupRouter('/playground/hub')) and render path
// (res.render('playground/hub/page.njk')) inside the copy still says
// "playground" — this rewrites them to the snapshot's own id so its routes
// don't collide with the live playground or with other snapshots.
//

const fs = require('fs')
const path = require('path')

const REWRITABLE_EXTENSIONS = ['.js', '.njk']

function walk(dir, found = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) walk(full, found)
    else if (REWRITABLE_EXTENSIONS.includes(path.extname(entry)))
      found.push(full)
  }
  return found
}

// \b...\b, not a plain global replace: a snapshot id starts with a digit and
// contains hyphens, so blindly substituting every "playground" substring
// would also corrupt identifiers like the session-data key
// `playgroundUploadedGuide` into `2026-09-25-fooUploadedGuide` (invalid
// JS). The word-boundary match only fires on standalone "playground"
// tokens — route prefixes and render paths — not mid-identifier.
const PLAYGROUND_WORD = /\bplayground\b/g

function rewritePlaygroundReferences(dir, snapshotId) {
  for (const file of walk(dir)) {
    const original = fs.readFileSync(file, 'utf8')
    const rewritten = original.replace(PLAYGROUND_WORD, snapshotId)
    if (rewritten !== original) fs.writeFileSync(file, rewritten)
  }
}

module.exports = { rewritePlaygroundReferences }
