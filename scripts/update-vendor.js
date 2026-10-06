#!/usr/bin/env node
// Copies browser artifacts from node_modules into app/assets/javascripts/vendor
// (fonts go to app/assets/fonts).
// The kit has no bundler, so these are committed and served as-is; the npm
// packages are dev dependencies only. TipTap is bundled by `npm run build:tiptap`.
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const VENDOR = path.join(ROOT, 'app', 'assets', 'javascripts', 'vendor')

const FONTS = path.join(ROOT, 'app', 'assets', 'fonts')

const COPIES = [
  {
    from: 'accessible-autocomplete/dist/accessible-autocomplete.min.js',
    to: 'accessible-autocomplete.min.js'
  },
  {
    from: 'accessible-autocomplete/dist/accessible-autocomplete.min.js.map',
    to: 'accessible-autocomplete.min.js.map'
  },
  {
    from: 'material-symbols/material-symbols-outlined.woff2',
    to: 'material-symbols-outlined.woff2',
    dir: FONTS
  }
]

for (const { from, to, dir = VENDOR } of COPIES) {
  fs.mkdirSync(dir, { recursive: true })
  fs.copyFileSync(path.join(ROOT, 'node_modules', from), path.join(dir, to))
  console.log(
    `node_modules/${from} -> ${path.relative(ROOT, path.join(dir, to))}`
  )
}
