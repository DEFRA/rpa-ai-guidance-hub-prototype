#!/usr/bin/env node
// Bundles the TipTap guide viewer into one browser script. The kit has no
// bundler, so the output is committed (like vendor/accessible-autocomplete)
// and nothing needs building at runtime. See README.md.
const path = require('node:path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '..', '..')

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src', 'viewer.js')],
    outfile: path.join(
      ROOT,
      'app',
      'assets',
      'javascripts',
      'vendor',
      'tiptap-viewer.js'
    ),
    bundle: true,
    format: 'iife',
    minify: true,
    // Off: the map is ~3MB, too heavy to commit for a prototype. Flip on
    // locally when debugging the viewer.
    sourcemap: false,
    target: ['es2020'],
    legalComments: 'linked',
    logLevel: 'info'
  })
  .catch(() => {
    process.exitCode = 1
  })
