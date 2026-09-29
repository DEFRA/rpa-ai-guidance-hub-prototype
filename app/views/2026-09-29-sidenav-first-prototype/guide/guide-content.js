const { marked } = require('marked')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')
const { fetchGuideContent } = require('../../../lib/guidance-api-client')

// A guide's Markdown content, fetched from the Prototype guides API
// (app/lib/guidance-api-client.js) rather than parsed off a
// guidanceDocuments entry's own `steps` — for these, latestVersionId
// (app/lib/guidance-api-loader.js) already names the exact version to
// read, so there's no manifest lookup to do here. Returns
// `{ isMarkdown: true, html }`, a different shape entirely from
// buildGuideContent's `{ sections, flatParts }` — the stepper/traditional
// format machinery doesn't apply to a plain rendered document, so
// guide/view-model.js short-circuits around it for these.
async function buildMarkdownGuideContent(documentId, versionId) {
  const markdown = await fetchGuideContent(documentId, versionId)
  if (!markdown) {
    return {
      isMarkdown: true,
      html: '<p class="govuk-body">This guide could not be loaded right now.</p>'
    }
  }

  // Images in the fetched Markdown are relative links into a shared
  // assets/ folder the browser can't reach directly (see
  // docs/prototype-guides-api.md's "Rendering images" section) — rewritten
  // here to the proxy route guide/routes.js exposes, which fetches the
  // real bytes server-side.
  const rewritten = markdown.replace(
    /\.\.\/assets\//g,
    `/2026-09-29-sidenav-first-prototype/guide/${encodeURIComponent(documentId)}/assets/`
  )

  return { isMarkdown: true, html: marked.parse(rewritten) }
}

// A single content shape for the guide page's three design directions,
// generalising the per-format logic the old stepper/traditional viewers
// each had their own copy of (view/stepper/controller.js,
// view/traditional/controller.js's buildTraditionalSections). Both formats
// read the same { sections, flatParts } — traditional walks sections in
// order, stepper walks flatParts by number — rather than each rebuilding
// its own shape from the source document.
//
// A guidanceDocuments entry's own "steps" can be nested (each top-level
// section holds a "parts" array of smaller sub-steps) or flat (one step
// per array entry); a document with neither (most ids — everything but
// the handful with real step content) falls back to
// generic-guidance-content.js's placeholder 3-phase content, same as
// before.
function buildGuideContent(guidanceDocument) {
  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      return fromSections(
        guidanceDocument.steps.map((section) => ({
          sectionName: section.sectionName,
          parts: section.parts.map((part) => ({
            heading: part.heading,
            body: part.body
          }))
        }))
      )
    }

    return fromSections(
      guidanceDocument.steps.map((step) => ({
        sectionName: step.sectionName,
        parts: [{ heading: step.heading, body: step.body }]
      }))
    )
  }

  const genericDocument =
    (guidanceDocument && genericGuidanceContent[guidanceDocument.id]) ||
    genericGuidanceContent['countryside-stewardship-capital-grants']

  return fromSections(
    genericDocument.sections.map((section) => ({
      sectionName: section.heading,
      parts: section.subsections.map((subsection) => ({
        heading: subsection.heading,
        body: subsection.content
      }))
    }))
  )
}

// Numbers sections and parts once, in one pass, and builds the flat
// parts list (with each part carrying its own section's number/name) that
// stepper mode paginates over — the same numbering document/view/stepper's
// controller.js already built for nested steps, just shared across all
// three content shapes instead of only the nested one.
function fromSections(rawSections) {
  let partNumber = 0
  const sections = rawSections.map((section, index) => {
    const sectionNumber = index + 1
    const parts = section.parts.map((part) => {
      partNumber += 1
      return {
        id: 'part-' + partNumber,
        partNumber,
        sectionNumber,
        sectionName: section.sectionName,
        heading: part.heading,
        body: part.body
      }
    })
    return {
      id: 'section-' + sectionNumber,
      sectionNumber,
      sectionName: section.sectionName,
      firstPartNumber: parts[0].partNumber,
      parts
    }
  })

  const flatParts = sections.reduce(
    (all, section) => all.concat(section.parts),
    []
  )

  return { sections, flatParts }
}

module.exports = { buildGuideContent, buildMarkdownGuideContent }
