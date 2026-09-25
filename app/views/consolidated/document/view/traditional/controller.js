const { guidanceDocuments } = require('../../../../../data/guidance-documents')
const guidanceLists = require('../../../../../data/guidance-lists')
const {
  documents: genericGuidanceContent
} = require('../../../../../data/generic-guidance-content')

// Flattens a document's own content into one consistent shape regardless
// of source — {id, heading, body}[], in reading order — so page.njk can
// render every section on one continuous page without caring which of the
// three content shapes produced them. Mirrors the exact per-shape logic
// the stepper viewer's own controller already has (nested customParts,
// flat customSteps, or the generic 3-phase genericGuidanceContent
// fallback), just collecting every entry instead of picking one by
// stepNumber.
function buildTraditionalSections(guidanceDocument) {
  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const sections = []
      guidanceDocument.steps.forEach((section) => {
        section.parts.forEach((part) => {
          sections.push({
            id: 'part-' + (sections.length + 1),
            heading: part.heading,
            body: part.body
          })
        })
      })
      return sections
    }

    return guidanceDocument.steps.map((step, index) => ({
      id: 'section-' + (index + 1),
      heading: step.heading,
      body: step.body
    }))
  }

  const genericDocument =
    (guidanceDocument && genericGuidanceContent[guidanceDocument.id]) ||
    genericGuidanceContent['countryside-stewardship-capital-grants']
  const sections = []
  genericDocument.sections.forEach((section) => {
    section.subsections.forEach((subsection) => {
      sections.push({
        id: subsection.id,
        heading: subsection.heading,
        body: subsection.content
      })
    })
  })
  return sections
}

// The traditional viewer — a genuine single-page A/B against the stepper
// (view/stepper/page.njk), showing the exact same document content (same
// buildTraditionalSections shapes as the stepper's own per-document logic)
// laid out continuously rather than one step at a time.
//
// Previously this route rendered fixed severity/issues content instead —
// not a document viewer at all, just an undocumented duplicate of
// /consolidated/issues' own Issues/Findings layout, carried over unfixed
// from the same mistake in the v6 pages ("Traditional viewer" on
// v6/guidance-document-choice) this was ported from. That content is
// still available, correctly, at /consolidated/issues — removing the
// duplicate here isn't a loss of functionality, just of the accidental
// mislabeling. See page.notes.md for the full history.
//
// Tracked as "recently opened" the same as a genuine Stepper visit
// (the stepper controller's own addRecentlyOpened call) —
// unconditionally, since this page has no ?step=-equivalent "already
// mid-visit" case to skip.
function get(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )

  if (guidanceDocument) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
  }

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : guidanceDocuments[0].title
  const version = guidanceDocument
    ? guidanceDocument.version
    : guidanceDocuments[0].version

  res.locals.backHref = '/consolidated/document/' + req.params.id

  res.render('consolidated/document/view/traditional/page.njk', {
    id: req.params.id,
    documentName,
    version,
    sections: buildTraditionalSections(guidanceDocument)
  })
}

module.exports = { get }
