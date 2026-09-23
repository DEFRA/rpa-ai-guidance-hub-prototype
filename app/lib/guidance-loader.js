//
// Synchronously loads guidance documents from .docx files in
// GUIDANCE_DATA_DIR (Documents/Guidance-data, at the project root — see
// .gitignore, which excludes it: these are real guidance .docx files, not
// fixture/sample data, and are never committed), for
// app/data/guidance-documents.js to merge onto the end of its own
// hardcoded array. loadGuidanceFromWordDocs() below returns a plain
// array, immediately — nothing here is exposed as a Promise, so every
// existing guidanceDocuments call site (a synchronous .find()/.filter()
// against the merged array — app/views/legacy/routes.js,
// app/views/v6/find-guidance, app/views/v6/document-overview,
// app/views/v6/editor-experiment, app/views/v6/manage-guidance,
// app/data/guidance-lists.js, app/data/manage-guidance.js) keeps working
// completely unchanged.
//
// mammoth.convertToHtml (guidance-loader-worker.js, which actually does
// the parsing) has no synchronous API of its own — it always returns a
// Promise, even given a file already on disk — so getting a genuinely
// complete, synchronous array out of this file at all requires running
// that async work somewhere Node is free to have its own event loop: a
// separate process. execFileSync blocks this (parent) process until that
// child one exits, so by the time loadGuidanceFromWordDocs() returns, the
// child's own async work has unconditionally finished — this is not a
// best-effort "probably done by the time anyone asks" race, the array
// returned here is always complete.
//
// This does mean one extra `node` process spawns — rather than sharing
// this process's own event loop — every time app/data/guidance-documents.js
// is first required, once per server start, and only when
// GUIDANCE_DATA_DIR actually has .docx files in it (see the early returns
// below, which skip spawning anything otherwise). Acceptable for a
// prototype's dev server; flagged here rather than treated as free.
//

const { existsSync, readdirSync } = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const GUIDANCE_DATA_DIR = path.join(
  __dirname,
  '..',
  '..',
  'Documents',
  'Guidance-data'
)
const WORKER_PATH = path.join(__dirname, 'guidance-loader-worker.js')

// Every failure mode here — the folder not existing, holding no .docx
// files, or the worker process itself failing for any reason — falls
// back to an empty array rather than throwing, so a missing/empty
// Guidance-data folder is a normal, silent state for this prototype, not
// a startup error. Logged to stderr either way (console.error, not
// console.warn/info, so it shows up in the same place the worker's own
// per-file parse failures already go — see that file's own comment), so
// a genuine problem is still visible in the terminal running the dev
// server, just never fatal to it.
//
// existingIds (app/data/guidance-documents.js passes every hardcoded
// entry's own id) guards against a loaded document silently shadowing —
// or sitting alongside as a confusing near-duplicate of — a hardcoded
// one: a loaded entry whose own slugified id already appears in
// existingIds is dropped, with a stderr warning naming which file and
// which id collided, rather than being appended anyway. This does not
// catch two DIFFERENT ids that both describe the same real document
// (e.g. a hardcoded 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026'
// alongside a loaded doc whose filename slugifies to something else
// entirely) — only an exact id match.
function loadGuidanceFromWordDocs(existingIds) {
  const existingIdSet = new Set(existingIds || [])

  if (!existsSync(GUIDANCE_DATA_DIR)) return []

  let docxFiles
  try {
    docxFiles = readdirSync(GUIDANCE_DATA_DIR).filter((name) =>
      name.toLowerCase().endsWith('.docx')
    )
  } catch (error) {
    console.error(
      '[guidance-loader] could not read ' + GUIDANCE_DATA_DIR + ':',
      error.message
    )
    return []
  }

  if (docxFiles.length === 0) return []

  const filePaths = docxFiles.map((name) => path.join(GUIDANCE_DATA_DIR, name))

  let loaded
  try {
    const stdout = execFileSync(process.execPath, [WORKER_PATH, ...filePaths], {
      encoding: 'utf8',
      // Word docs, and mammoth's own HTML output, can be large; the
      // default 1MB stdout buffer is comfortably enough for a handful
      // of guidance documents but not left unbounded.
      maxBuffer: 20 * 1024 * 1024
    })
    loaded = JSON.parse(stdout)
  } catch (error) {
    console.error(
      '[guidance-loader] failed to load .docx files from ' +
        GUIDANCE_DATA_DIR +
        ':',
      error.message
    )
    return []
  }

  return loaded.filter((entry) => {
    if (!existingIdSet.has(entry.id)) return true
    console.error(
      '[guidance-loader] skipping loaded entry "' +
        entry.id +
        '" (' +
        entry.title +
        '): id already used by a hardcoded guidance-documents.js entry'
    )
    return false
  })
}

module.exports = { loadGuidanceFromWordDocs, GUIDANCE_DATA_DIR }
