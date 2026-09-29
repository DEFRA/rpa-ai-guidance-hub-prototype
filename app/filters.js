//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const { renderMarkdownFallback } = require('./lib/markdown-fallback')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

// Turns any {{LINK:label text}} marker in a document step's body text
// (app/data/guidance-documents.js) into a non-navigating, govuk-link-styled
// placeholder — for guidance referenced by name that has no real page to
// link to yet. Everything else in the string is HTML-escaped exactly as
// Nunjucks' own autoescaping would do, since renderAsHtml below marks this
// filter's return value safe to insert as-is. Generic by design: any body
// string without a marker just comes back escaped and unchanged, so this can
// be applied to every paragraph/bullet in saved-document-view.html rather
// than singled out for one document.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderLinkMarkers(value) {
  const text = String(value)
  const linkPattern = /{{LINK:([^}]+)}}/g
  let result = ''
  let lastIndex = 0
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index))
    result +=
      '<a href="#" class="govuk-link" onclick="return false;">' +
      escapeHtml(match[1]) +
      '</a>'
    lastIndex = linkPattern.lastIndex
  }
  result += escapeHtml(text.slice(lastIndex))

  return result
}

addFilter('renderLinkMarkers', renderLinkMarkers, { renderAsHtml: true })

// JSON for a <script type="application/json"> block. Every "<" is escaped
// so content containing "</script>" can't end the block early.
addFilter(
  'jsonScript',
  (value) => JSON.stringify(value).replace(/</g, '\\u003c'),
  { renderAsHtml: true }
)

// A converted guide's Markdown rendered server-side (app/lib/markdown-fallback.js):
// the no-JS view, and what find-in-page searches on hidden stepper pages.
// Only renders committed sample content (app/data/guides), same trust as
// page notes.
addFilter('markdownFallback', renderMarkdownFallback, { renderAsHtml: true })
