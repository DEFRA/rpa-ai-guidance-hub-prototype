//
// Builds guidanceDocuments — the merged array every call site reads
// (app/data/guidance-lists.js, app/data/manage-guidance.js,
// app/data/context-pane.js, playground's document/editor/guide/hub pages,
// and both frozen snapshots that still require this module by its old
// path, `app/data/guidance-documents` — Node resolves that straight to
// this index.js, so none of them needed to change).
//
// When GUIDANCE_API_ENABLED is off (the default), this is: metadata.js's
// 23 documents, each with its real step content merged back on from its
// own .md file in ./content/ (see app/lib/guidance-content-loader.js —
// most ids have no .md file and so no steps, same as before), plus
// whatever app/lib/guidance-loader.js finds in Documents/Guidance-data
// (project root — .gitignore'd, real guidance .docx files are never
// committed), appended after them and skipped on an id collision. When the
// flag is on, all of that is bypassed in favour of the (currently stubbed)
// API-backed loader — see app/lib/guidance-api-loader.js.
//

const { GUIDANCE_API_ENABLED } = require('../../lib/feature-flags')
const { loadGuidanceFromApi } = require('../../lib/guidance-api-loader')
const { loadGuidanceContent } = require('../../lib/guidance-content-loader')
const { loadGuidanceFromWordDocs } = require('../../lib/guidance-loader')
const metadataDocuments = require('./metadata')

const hardcodedGuidanceDocuments = metadataDocuments.map((document) => {
  const content = loadGuidanceContent(document.id)
  return content ? { ...document, ...content } : document
})

const guidanceDocuments = GUIDANCE_API_ENABLED
  ? loadGuidanceFromApi()
  : hardcodedGuidanceDocuments.concat(
      loadGuidanceFromWordDocs(
        hardcodedGuidanceDocuments.map((document) => document.id)
      )
    )

module.exports = { guidanceDocuments }
