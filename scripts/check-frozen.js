#!/usr/bin/env node
//
// npm run check:frozen
//
// Every app/views/<id>/ directory containing a .snapshot.json was frozen by
// scripts/snapshot.js at some point — this re-hashes each one and diffs it
// against the manifest recorded at freeze time, so a hand edit that slipped
// past the Claude Code hook (scripts/hooks/block-frozen-edit.js) still gets
// caught, in CI or locally. Exits non-zero if any snapshot has drifted.
//

const fs = require('fs')
const path = require('path')

const { hashDir, MANIFEST_FILE } = require('./lib/manifest')

const viewsDir = path.join(__dirname, '..', 'app', 'views')

function snapshotDirs() {
  return fs
    .readdirSync(viewsDir)
    .map((entry) => path.join(viewsDir, entry))
    .filter(
      (full) =>
        fs.statSync(full).isDirectory() &&
        fs.existsSync(path.join(full, MANIFEST_FILE))
    )
}

function diff(recorded, current) {
  const added = Object.keys(current).filter((file) => !(file in recorded))
  const removed = Object.keys(recorded).filter((file) => !(file in current))
  const modified = Object.keys(recorded).filter(
    (file) => file in current && current[file] !== recorded[file]
  )
  return { added, removed, modified }
}

function main() {
  const dirs = snapshotDirs()
  let hasDrift = false

  for (const dir of dirs) {
    const id = path.basename(dir)
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dir, MANIFEST_FILE), 'utf8')
    )
    const current = hashDir(dir)
    const { added, removed, modified } = diff(manifest.files, current)

    if (added.length || removed.length || modified.length) {
      hasDrift = true
      console.error(`✗ ${id} has changed since it was frozen:`)
      for (const file of added) console.error(`    added:    ${file}`)
      for (const file of removed) console.error(`    removed:  ${file}`)
      for (const file of modified) console.error(`    modified: ${file}`)
    } else {
      console.log(`✓ ${id} unchanged`)
    }
  }

  if (dirs.length === 0) {
    console.log('No frozen snapshots found under app/views/.')
  }

  if (hasDrift) {
    console.error(
      '\nA frozen snapshot has been edited. Revert the change, or if it was ' +
        'intentional, take a fresh snapshot instead of editing an old one.'
    )
    process.exit(1)
  }
}

main()
