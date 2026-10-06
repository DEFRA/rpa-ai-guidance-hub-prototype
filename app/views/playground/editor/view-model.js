const { marked } = require('marked')
const { guidanceDocuments } = require('../../../data/guidance-documents')
const { buildEditorSections } = require('../../../data/editor-experiment')
const { findApiGuide } = require('../guide/view-model')
const {
  loadApiGuideContent,
  loadGuideContent
} = require('../guide/guide-content')

// Marked emits bare tags; the editor content uses GOV.UK typography classes.
function withGovukClasses(html) {
  return html
    .replace(/<p>/g, '<p class="govuk-body">')
    .replace(/<ul>/g, '<ul class="govuk-list govuk-list--bullet">')
    .replace(/<ol>/g, '<ol class="govuk-list govuk-list--number">')
    .replace(/<h([3-6])>/g, '<h$1 class="govuk-heading-s">')
}

// One editor section per part, in the shape buildEditorSections already
// returns; markdown parts carry rendered `html`, a lead part is an h2 and
// any other part an h3.
function sectionsFromContent(content) {
  return content.flatParts.map((part, index) => ({
    id: `section-${index + 1}`,
    name: part.heading,
    heading: part.heading,
    isSubPart: !part.isLead,
    ...(part.markdown !== undefined
      ? { html: withGovukClasses(marked.parse(part.markdown || '')) }
      : { body: part.body })
  }))
}

// The selected guide's own content (API guide, content.md guide or
// structured mock guide) as editor sections, or null for an id that names no
// guide, so the editor falls back to its fixed sample.
async function loadEditorSections(req, id) {
  if (!id) return null

  const apiGuide = await findApiGuide(req, id)
  if (apiGuide) {
    const content = await loadApiGuideContent(
      apiGuide.apiId,
      apiGuide.latestVersionId,
      id
    )
    return content ? sectionsFromContent(content) : null
  }

  const { content } = loadGuideContent(id)
  if (content && content.isMarkdown) return sectionsFromContent(content)

  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === id
  )
  return guidanceDocument ? buildEditorSections(guidanceDocument) : null
}

module.exports = { loadEditorSections }
