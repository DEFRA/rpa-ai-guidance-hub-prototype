const { Marked } = require('marked')
const { slugify, resolveHashLinks } = require('../../../lib/heading-links')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')
const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  readGuideMarkdown,
  splitGuideMarkdown
} = require('../../../data/guide-markdown')
const { fetchGuideContent } = require('../../../lib/guidance-api-client')

function renderLazyImage({ href, title, text }) {
  const alt = String(text).replace(/"/g, '&quot;')
  const titleAttr = title
    ? ` title="${String(title).replace(/"/g, '&quot;')}"`
    : ''
  return `<img src="${href}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`
}

// An API guide that stays as one rendered blob still needs slugged heading
// ids (for #fragment links and the contents sidebar), plus lazy images.
function renderApiMarkdown(source) {
  const used = new Set()
  const headings = []
  const marked = new Marked({
    renderer: {
      image: renderLazyImage,
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const plain = text.replace(/<[^>]+>/g, '')
        const base = slugify(plain) || 'section'
        let id = base
        for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`
        used.add(id)
        if (depth >= 2 && depth <= 3) headings.push({ id, text: plain, depth })
        return `<h${depth} id="${id}">${text}</h${depth}>\n`
      }
    }
  })

  return { html: marked.parse(source), headings }
}

// A guide's Markdown content, fetched from the Prototype guides API
// (app/lib/guidance-api-client.js) rather than parsed off a
// guidanceDocuments entry's own `steps` — for these, latestVersionId
// (app/lib/guidance-api-loader.js) already names the exact version to
// read, so there's no manifest lookup to do here. Returns
// `{ isApiGuide: true, html }` — the flat fallback for a guide
// loadApiGuideContent can't split into sections.
async function buildMarkdownGuideContent(documentId, versionId) {
  const markdown = await fetchGuideContent(documentId, versionId)
  if (!markdown) {
    return {
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

  const first = renderApiMarkdown(rewritten)
  const linked = resolveHashLinks(
    rewritten,
    first.headings.map((heading) => ({
      text: heading.text,
      href: '#' + heading.id
    }))
  )
  const final = linked === rewritten ? first : renderApiMarkdown(linked)

  return { isApiGuide: true, html: final.html, contents: final.headings }
}

// API guides open with a single "# Title" that the page already shows as
// its h1. Left in, it would be the only section (the shallowest heading
// level) and the whole guide one stepper page, so it's dropped.
function withoutTitleHeading(markdown) {
  const titles = markdown.match(/^# .*$/gm) || []
  if (titles.length !== 1 || !markdown.trimStart().startsWith(titles[0])) {
    return markdown
  }
  return markdown.trimStart().slice(titles[0].length)
}

// An API guide's Markdown through the same split as a local content.md, so
// it gets the sections/parts model and the stepper. Null when the fetch
// fails or the document has no headings to split on — the caller then falls
// back to buildMarkdownGuideContent's flat rendering.
async function loadApiGuideContent(documentId, versionId) {
  const markdown = await fetchGuideContent(documentId, versionId)
  if (!markdown) return null

  const sections = splitGuideMarkdown(
    withoutTitleHeading(markdown),
    encodeURIComponent(documentId)
  )
  return sections.length ? buildGuideContent(null, sections) : null
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
        partName: part.partName,
        heading: part.heading,
        body: part.body,
        markdown: part.markdown,
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
  loadApiGuideContent,
  loadGuideContent,
  groupPages,
  findAnchor
}
