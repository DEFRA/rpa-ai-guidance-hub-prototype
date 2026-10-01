#!/usr/bin/env node
// Copies browser artifacts from node_modules into app/assets/javascripts/vendor.
// The kit has no bundler, so these are committed and served as-is; the npm
// packages are dev dependencies only. TipTap is bundled by `npm run build:tiptap`.
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const VENDOR = path.join(ROOT, 'app', 'assets', 'javascripts', 'vendor')

const COPIES = [
  {
    from: 'accessible-autocomplete/dist/accessible-autocomplete.min.js',
    to: 'accessible-autocomplete.min.js'
  },
  {
    from: 'accessible-autocomplete/dist/accessible-autocomplete.min.js.map',
    to: 'accessible-autocomplete.min.js.map'
  }
]

fs.mkdirSync(VENDOR, { recursive: true })

for (const { from, to } of COPIES) {
  fs.copyFileSync(path.join(ROOT, 'node_modules', from), path.join(VENDOR, to))
  console.log(`node_modules/${from} -> vendor/${to}`)
}
