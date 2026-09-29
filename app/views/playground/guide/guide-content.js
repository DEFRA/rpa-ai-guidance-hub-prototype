const { Marked } = require('marked')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')
const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  readGuideMarkdown,
  splitGuideMarkdown
} = require('../../../data/guide-markdown')
const { fetchGuideContent } = require('../../../lib/guidance-api-client')

// A guide's images fetch lazily, and only once near the viewport — without
// this a guide with several images fetches all of them upfront, whether
// they're ever scrolled to or not. See _app-guide.scss and
// guide-images.js for the reserved-space placeholder this depends on
// (without it, a run of same-sized lazy images collapses to 0px height,
// so the browser treats every one of them as "near" the viewport too).
const marked = new Marked({
  renderer: {
    image({ href, title, text }) {
      const alt = String(text).replace(/"/g, '&quot;')
      const titleAttr = title
        ? ` title="${String(title).replace(/"/g, '&quot;')}"`
        : ''
      return `<img src="${href}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`
    }
  }
})

// Same `## section` / `### part` convention the mock content's own .md
// files use (app/lib/guidance-content-loader.js's HEADING_LINE, including
// its optional `[heading: ...]` sidebar/reading-heading override) — the
// fetched Markdown is the same underlying guidance content, just served
// from the Prototype guides API instead of a baked-in .md file, so
// splitting on it lets an API guide's stepper walk real
// section/part boundaries the same way a mock guide's does. Unlike the
// mock loader, each part's body is rendered to real HTML via `marked`
// (not hand-parsed into paragraphs/bullets) — an API guide's Markdown can
// use the full dialect (bold, links, images, tables), not just the small
// subset the mock content sticks to. Returns null when the content has no
// `## ` headings at all, so callers can fall back to the single rendered
// blob rather than a one-part "guide".
const HEADING_LINE = /^(#{2,3})\s+(.+?)(?:\s*\[heading:\s*(.+?)\s*\])?$/

function splitMarkdownIntoSections(markdown) {
  const lines = markdown.split('\n')
  const sectionStarts = []
  lines.forEach((line, index) => {
    if (/^##\s+/.test(line)) sectionStarts.push(index)
  })
  if (!sectionStarts.length) return null

  return sectionStarts.map((start, sectionIndex) => {
    const end =
      sectionIndex + 1 < sectionStarts.length
        ? sectionStarts[sectionIndex + 1]
        : lines.length
    const sectionHeadingMatch = lines[start].match(HEADING_LINE)
    const sectionName = sectionHeadingMatch[2].trim()
    const sectionHeading = (sectionHeadingMatch[3] || sectionName).trim()
    const sectionLines = lines.slice(start + 1, end)

    const partStarts = []
    sectionLines.forEach((line, index) => {
      if (/^###\s+/.test(line)) partStarts.push(index)
    })

    if (!partStarts.length) {
      return {
        sectionName,
        parts: [
          {
            heading: sectionHeading,
            markdown: sectionLines.join('\n'),
            isLead: true
          }
        ]
      }
    }

    const parts = []
    const leadMarkdown = sectionLines.slice(0, partStarts[0]).join('\n').trim()
    if (leadMarkdown) {
      parts.push({
        heading: sectionHeading,
        markdown: leadMarkdown,
        isLead: true
      })
    }

    partStarts.forEach((partStart, partIndex) => {
      const partEnd =
        partIndex + 1 < partStarts.length
          ? partStarts[partIndex + 1]
          : sectionLines.length
      const partHeadingMatch = sectionLines[partStart].match(HEADING_LINE)
      const partName = partHeadingMatch[2].trim()
      const heading = (partHeadingMatch[3] || partName).trim()
      parts.push({
        partName,
        heading,
        markdown: sectionLines.slice(partStart + 1, partEnd).join('\n')
      })
    })

    return { sectionName, parts }
  })
}

// A guide's Markdown content, fetched from the Prototype guides API
// (app/lib/guidance-api-client.js) rather than parsed off a
// guidanceDocuments entry's own `steps` — for these, latestVersionId
// (app/lib/guidance-api-loader.js) already names the exact version to
// read, so there's no manifest lookup to do here. Always carries the
// whole-document `html` (used for the traditional format, unchanged), and
// — when the content splits into sections — `sections`/`flatParts` too, so
// guide/view-model.js can build the same stepper pagination a mock guide
// gets. `error: true` (content fetch failed) is the one case with neither:
// nothing to paginate, so the format toggle stays hidden for it.
async function buildMarkdownGuideContent(documentId, versionId) {
  const markdown = await fetchGuideContent(documentId, versionId)
  if (!markdown) {
    return {
      isMarkdown: true,
      isApiGuide: true,
      error: true,
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
    `/playground/guide/${encodeURIComponent(documentId)}/assets/`
  )
  const markdownSections = splitMarkdownIntoSections(rewritten)

  return {
    isMarkdown: true,
    isApiGuide: true,
    html: marked.parse(rewritten),
    ...(markdownSections
      ? fromSections(markdownSections, { renderMarkdown: true })
      : {})
  }
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
//
// A converted guide's Markdown (guide-markdown.js's splitGuideMarkdown)
// takes precedence over all of these: its parts carry `markdown`, rendered
// by the TipTap viewer, instead of a `body`.
function buildGuideContent(guidanceDocument, markdownSections) {
  if (Array.isArray(markdownSections) && markdownSections.length) {
    return { ...fromSections(markdownSections), isMarkdown: true }
  }

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
function fromSections(rawSections, { renderMarkdown = false } = {}) {
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
        partName: part.partName,
        heading: part.heading,
        body: part.body,
        markdown: part.markdown,
        html:
          part.html ||
          (renderMarkdown && part.markdown
            ? marked.parse(part.markdown)
            : null),
        isLead: Boolean(part.isLead)
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

// A guide's content by id: its content.md where one exists, otherwise
// its structured JS content. Shared by the guide page and the pages that
// need to resolve its sections (bookmark/, section/, position/).
function loadGuideContent(id) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === id
  )
  const markdown = readGuideMarkdown(id)
  const content = buildGuideContent(
    guidanceDocument,
    markdown ? splitGuideMarkdown(markdown, id) : null
  )
  return { guidanceDocument, content }
}

// The stepper's "pages": groups of whole sections, from the guide's
// metadata (guide-metadata.js's getStepperPages) or one section per page
// by default. A section a grouping leaves out gets a page of its own at
// the end, so a mistyped grouping never hides content.
function groupPages(content, groups) {
  const byNumber = {}
  content.sections.forEach((section) => {
    byNumber[section.sectionNumber] = section
  })

  const used = {}
  const pages = []
  ;(groups || []).forEach((group) => {
    const sections = group.sections
      .map((number) => byNumber[number])
      .filter((section) => section && !used[section.sectionNumber])
    if (!sections.length) return
    sections.forEach((section) => {
      used[section.sectionNumber] = true
    })
    pages.push({ title: group.title || sections[0].sectionName, sections })
  })

  content.sections
    .filter((section) => !used[section.sectionNumber])
    .forEach((section) => {
      pages.push({ title: section.sectionName, sections: [section] })
    })

  return pages.map((page, index) => ({ ...page, pageNumber: index + 1 }))
}

// Where a section-N / part-N anchor lives: its page, and a label for it
// (the part's heading, or the section's name) — or null if it isn't one
// of this guide's.
function findAnchor(pages, anchor) {
  for (const page of pages) {
    for (const section of page.sections) {
      if (section.id === anchor) {
        return {
          anchor,
          pageNumber: page.pageNumber,
          label: section.sectionName
        }
      }
      const part = section.parts.find((candidate) => candidate.id === anchor)
      if (part) {
        return { anchor, pageNumber: page.pageNumber, label: part.heading }
      }
    }
  }
  return null
}

module.exports = {
  buildGuideContent,
  buildMarkdownGuideContent,
  loadGuideContent,
  groupPages,
  findAnchor
}
