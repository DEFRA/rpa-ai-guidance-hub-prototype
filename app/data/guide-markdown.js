const fs = require('node:fs')
const path = require('node:path')

// Converted guides, stored the way the API's document store lays them out
// (rpa-ai-guidance-hub-api app/guidance/documents/store.py): one directory
// per guide, holding content.md beside an assets/ directory of images.
const GUIDES_DIR = path.join(__dirname, 'guides')
const ID_PATTERN = /^[a-z0-9-]+$/

// The same heading and fence rules as the UI repo's preview
// (scripts/preview-markdown/sections.js), so a heading inside a code
// fence never splits a guide.
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const FENCE = /^ {0,3}(```|~~~)/

// The converter writes image paths relative to the document ("assets/…",
// sometimes "../assets/…"). The guide page's own URL is /playground/guide/<id>,
// which would resolve those against /playground/guide/ and lose the id.
const ASSET_REF = /\]\((?:\.{1,2}\/)?assets\//g

function guideDir(id) {
  return ID_PATTERN.test(String(id)) ? path.join(GUIDES_DIR, id) : null
}

function readGuideMarkdown(id) {
  const dir = guideDir(id)
  if (!dir) return null

  try {
    return fs.readFileSync(path.join(dir, 'content.md'), 'utf8')
  } catch {
    return null
  }
}

// Heading text as a contents-list label: the converter's own numbering
// ("2.1 Check…") is kept, but emphasis markers and escapes aren't.
function headingText(raw) {
  return raw
    .replace(/\*\*|__/g, '')
    .replace(/\\(.)/g, '$1')
    .trim()
}

function headingsOf(lines) {
  const headings = []
  let inFence = false

  lines.forEach((line, index) => {
    if (FENCE.test(line)) {
      inFence = !inFence
      return
    }
    const match = !inFence && HEADING.exec(line)
    if (match) {
      headings.push({ index, level: match[1].length, text: match[2] })
    }
  })

  return headings
}

// Splits a guide into { sectionName, parts: [{ heading, markdown }] } — the
// raw shape guide-content.js's fromSections() already numbers — so the
// stepper, contents list and pagination work unchanged. The shallowest
// heading level present is a section, the next one down is a part; deeper
// headings stay inside their part's Markdown for TipTap to render. Every
// section opens with a lead part (isLead) headed with the section's own
// name, holding any text before its first subheading — possibly none — so
// the section's name always shows in the body, and the contents list can
// leave the lead out of its sub-list rather than repeating the name.
function splitGuideMarkdown(markdown, id) {
  const lines = markdown
    .replace(ASSET_REF, '](/playground/guide/' + id + '/assets/')
    .split('\n')
  const headings = headingsOf(lines)

  const levels = [...new Set(headings.map((heading) => heading.level))].sort()
  const sectionLevel = levels[0]
  const partLevel = levels[1]
  const breaks = headings.filter(
    (heading) => heading.level === sectionLevel || heading.level === partLevel
  )

  const sections = []
  const leading = lines.slice(0, breaks.length ? breaks[0].index : undefined)
  if (leading.join('').trim()) {
    sections.push({
      sectionName: 'Introduction',
      parts: [
        {
          heading: 'Introduction',
          markdown: leading.join('\n').trim(),
          isLead: true
        }
      ]
    })
  }

  breaks.forEach((heading, position) => {
    const next = breaks[position + 1]
    const body = lines
      .slice(heading.index + 1, next ? next.index : undefined)
      .join('\n')
      .trim()
    const text = headingText(heading.text)

    if (heading.level === sectionLevel) {
      sections.push({
        sectionName: text,
        parts: [{ heading: text, markdown: body, isLead: true }]
      })
      return
    }

    if (!sections.length) {
      sections.push({
        sectionName: 'Introduction',
        parts: [{ heading: 'Introduction', markdown: '', isLead: true }]
      })
    }
    sections[sections.length - 1].parts.push({ heading: text, markdown: body })
  })

  return sections
}

// An asset file's absolute path, or null if the id or file name would
// reach outside the guide's own assets/ directory, or the file isn't there.
function guideAssetPath(id, file) {
  const dir = guideDir(id)
  if (!dir) return null

  const assetsDir = path.join(dir, 'assets')
  const resolved = path.resolve(assetsDir, String(file))
  const relative = path.relative(assetsDir, resolved)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return null
  }

  return fs.existsSync(resolved) ? resolved : null
}

module.exports = { readGuideMarkdown, splitGuideMarkdown, guideAssetPath }
