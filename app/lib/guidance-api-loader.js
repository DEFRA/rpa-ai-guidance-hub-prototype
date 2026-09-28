//
// Stand-in for the real API-backed guidance loader — the real service
// (app.guidance.service.convert, a separate repo) stores each document's
// metadata in Mongo and each version's parsed content as a content.md file
// in S3 (see docs/guidance-document-storage.md and
// docs/guidance-markdown-dialect.md for the storage layout and Markdown
// dialect). None of that — endpoint, auth, or a renderer for that dialect —
// exists in this prototype yet, so this only proves the
// GUIDANCE_API_ENABLED switch (app/lib/feature-flags.js,
// app/data/guidance-documents/index.js) rather than actually calling
// anything.
//
// Returns an empty array so flipping the flag on ahead of the real
// integration landing fails safe (no guidance documents show, logged to
// stderr) rather than crashing the dev server — the same fallback
// philosophy app/lib/guidance-loader.js already uses for a missing/empty
// Documents/Guidance-data folder.
//
function loadGuidanceFromApi() {
  console.error(
    '[guidance-api-loader] GUIDANCE_API_ENABLED is set but the API-backed loader is not implemented yet — returning no documents'
  )
  return []
}

module.exports = { loadGuidanceFromApi }
