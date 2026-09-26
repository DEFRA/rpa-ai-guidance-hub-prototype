//
// Shared by scripts/snapshot.js (writes the manifest a snapshot is frozen
// against) and scripts/check-frozen.js (recomputes it later to detect
// drift). A manifest is just a map of every file in a directory to its
// sha256, relative to that directory — .snapshot.json itself is always
// excluded, since it can't hash itself.
//

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const MANIFEST_FILE = '.snapshot.json'

function walk(dir, found = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) walk(full, found)
    else found.push(full)
  }
  return found
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function hashDir(dir) {
  const files = {}

  for (const file of walk(dir)) {
    const relPath = path.relative(dir, file)
    if (relPath === MANIFEST_FILE) continue
    files[relPath] = hashFile(file)
  }

  return files
}

module.exports = { hashDir, MANIFEST_FILE }
