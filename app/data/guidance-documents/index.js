//
// Builds guidanceDocuments — the mock, always-synchronous array most call
// sites still read unchanged (app/data/guidance-lists.js,
// app/data/manage-guidance.js, app/data/context-pane.js, playground's
// document/editor pages, and both frozen snapshots that still require
// this module by its old path, `app/data/guidance-documents` — Node
// resolves that straight to this index.js, so none of them needed to
// change): metadata.js's 23 documents, each with its real step content
// merged back on from its own .md file in ./content/ (see
// app/lib/guidance-content-loader.js — most ids have no .md file and so
// no steps, same as before).
//
// getGuidanceDocuments() below is the API-aware entry point: the hub and
// guide pages (the only two that render a live guide list/a single
// guide's content, rather than the mock manage-guidance/editor machinery)
// call that instead, to get the real API-backed guides when
// GUIDANCE_API_ENABLED is on.
//

const { GUIDANCE_API_ENABLED } = require('../../lib/feature-flags')
const { loadGuidanceFromApi } = require('../../lib/guidance-api-loader')
const { loadGuidanceContent } = require('../../lib/guidance-content-loader')
const metadataDocuments = require('./metadata')

const hardcodedGuidanceDocuments = metadataDocuments.map((document) => {
  const content = loadGuidanceContent(document.id)
  return content ? { ...document, ...content } : document
})

// The synchronous, always-available dataset — every existing consumer
// (manage-guidance.js, document/, editor, both frozen snapshots) keeps
// reading this exactly as before, API flag or not, since none of them can
// await a fetch mid-render.
const guidanceDocuments = hardcodedGuidanceDocuments

// The API-aware entry point — hub and guide, the two pages that actually
// need live API-sourced guides, call this instead. Fetches the manifest
// fresh on every call (no caching: "load the manifest when the hub page is
// hit", not once at startup) when the flag is on, falling back to
// guidanceDocuments — logged — if the API call fails or the manifest is
// empty, so a bad API response degrades to "the mock hub", never a blank
// page. When the flag is off this is just guidanceDocuments, wrapped in a
// Promise so every call site can await it unconditionally.
async function getGuidanceDocuments() {
  if (!GUIDANCE_API_ENABLED) return guidanceDocuments

  const apiDocuments = await loadGuidanceFromApi()
  if (apiDocuments.length) return apiDocuments

  console.error(
    '[guidance-documents] GUIDANCE_API_ENABLED is set but the API returned no guides — falling back to the mock guidance documents'
  )
  return guidanceDocuments
}

// getGuidanceDocuments once per request, however many handlers ask — and
// exposed on req.apiGuides (which app/data/side-nav.js reads synchronously)
// when the API is on.
async function getRequestGuidanceDocuments(req) {
  if (!req.guidanceDocumentsPromise) {
    req.guidanceDocumentsPromise = getGuidanceDocuments()
  }
  const documents = await req.guidanceDocumentsPromise
  if (GUIDANCE_API_ENABLED) req.apiGuides = documents
  return documents
}

module.exports = {
  guidanceDocuments,
  getGuidanceDocuments,
  getRequestGuidanceDocuments
}
