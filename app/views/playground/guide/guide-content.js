const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')

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

module.exports = { buildGuideContent }
