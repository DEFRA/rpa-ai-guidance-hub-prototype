//
// Parses a guidance document's real step content out of its own .md file
// in app/data/guidance-documents/content/ (one per document id that has
// real content — most ids don't, and fall back to
// app/data/generic-guidance-content.js instead, same as before). Not a
// general-purpose Markdown parser: it only understands the small subset
// this mock content actually uses (## section / ### part headings, plain
// paragraphs, `- ` bullet lists) — nowhere near the full production
// dialect (colour spans, tables, anchors, images) described in
// docs/guidance-markdown-dialect.md, which is separate, larger, future
// work for whoever builds the real renderer.
//
// Returns the exact { steps: [...] } shape app/data/guidance-documents/
// index.js has always merged onto a document's metadata, and that
// app/views/playground/guide/guide-content.js and app/data/editor-experiment.js
// already know how to read — nested sections>parts when a section has any
// ### headings under it, flat sectionName/heading/body steps otherwise
// (the same test guide-content.js's own isNestedSteps already uses).
//

const fs = require('fs')
const path = require('path')

const CONTENT_DIR = path.join(
  __dirname,
  '..',
  'data',
  'guidance-documents',
  'content'
)

// The one body element in the whole mock dataset with no plain-Markdown
// equivalent — a structured "which way next" choice (resolveBranchOptions,
// app/views/playground/guide/view-model.js), rendered as its own component
// rather than prose. Rather than invent a one-off Markdown extension for a
// single occurrence, the .md carries a `[[BRANCH:key]]` placeholder
// paragraph at the right point in the text, and parseBody below swaps it
// for the real object defined here.
const BRANCHES = {
  'new-case-resolved-check': {
    type: 'branch',
    question: 'Is there a resolved case present relating to the query?',
    options: [
      {
        text: 'Yes',
        description: 'skip to the Child Cases part of this guidance',
        target: 'Child Cases'
      },
      {
        text: 'No',
        description: 'continue reading below to create a new case'
      }
    ]
  }
}

const BRANCH_PLACEHOLDER = /^\[\[BRANCH:(.+)\]\]$/
// Captures the heading level (## or ###), the heading text, and an
// optional `[heading: ...]` override — a couple of sections/parts in the
// mock content use a different label for their sidebar/TOC name than for
// the heading actually shown when reading (a pre-existing quirk of the
// hand-authored content, not something worth inventing two-heading
// front matter for everywhere), so the override only appears where needed.
const HEADING_LINE = /^(#{2,3})\s+(.+?)(?:\s*\[heading:\s*(.+?)\s*\])?$/

function loadGuidanceContent(id) {
  const filePath = path.join(CONTENT_DIR, `${id}.md`)
  if (!fs.existsSync(filePath)) return null

  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  return { steps: parseSections(lines) }
}

// Blocks are separated by blank lines: a block of contiguous `- ` lines
// becomes one bullet body entry (an array of strings), anything else
// becomes one paragraph body entry (a string) — except a block that is
// exactly a `[[BRANCH:key]]` placeholder, which becomes the structured
// object it names instead. `{{LINK:...}}` markers and the literal
// CASE_NOTE_BLOCK sentinel both already work as plain text within that,
// so neither needs any special handling here.
function parseBody(contentLines) {
  const blocks = []
  let current = []
  contentLines.forEach((line) => {
    if (line.trim() === '') {
      if (current.length) blocks.push(current)
      current = []
    } else {
      current.push(line)
    }
  })
  if (current.length) blocks.push(current)

  return blocks.map((block) => {
    const isBulletList = block.every((line) => line.trim().startsWith('- '))
    if (isBulletList) {
      return block.map((line) => line.trim().slice(2).trim())
    }

    const paragraph = block.map((line) => line.trim()).join(' ')
    const branchMatch = paragraph.match(BRANCH_PLACEHOLDER)
    if (!branchMatch) return paragraph

    const branch = BRANCHES[branchMatch[1]]
    if (!branch) {
      throw new Error(
        `guidance-content-loader: no branch defined for "${branchMatch[1]}"`
      )
    }
    return branch
  })
}

function parseSections(lines) {
  const sectionStarts = []
  lines.forEach((line, index) => {
    if (/^##\s+/.test(line)) sectionStarts.push(index)
  })

  return sectionStarts.map((start, sectionIndex) => {
    const end =
      sectionIndex + 1 < sectionStarts.length
        ? sectionStarts[sectionIndex + 1]
        : lines.length
    const headingMatch = lines[start].match(HEADING_LINE)
    const sectionName = headingMatch[2].trim()
    const sectionLines = lines.slice(start + 1, end)
    const sectionNumber = sectionIndex + 1

    const partStarts = []
    sectionLines.forEach((line, index) => {
      if (/^###\s+/.test(line)) partStarts.push(index)
    })

    if (!partStarts.length) {
      return {
        sectionNumber,
        sectionName,
        heading: (headingMatch[3] || sectionName).trim(),
        body: parseBody(sectionLines)
      }
    }

    const parts = partStarts.map((partStart, partIndex) => {
      const partEnd =
        partIndex + 1 < partStarts.length
          ? partStarts[partIndex + 1]
          : sectionLines.length
      const partHeadingMatch = sectionLines[partStart].match(HEADING_LINE)
      const partName = partHeadingMatch[2].trim()

      return {
        partName,
        heading: (partHeadingMatch[3] || partName).trim(),
        body: parseBody(sectionLines.slice(partStart + 1, partEnd))
      }
    })

    return { sectionNumber, sectionName, parts }
  })
}

module.exports = { loadGuidanceContent }
