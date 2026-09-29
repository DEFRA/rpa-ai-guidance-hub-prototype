const { Marked } = require('marked')

// Server-rendered HTML for a converted guide's Markdown. It's what a reader
// sees before the TipTap viewer takes over, with no JavaScript, and on a
// stepper page revealed by find-in-page (which keeps it rather than being
// swapped for TipTap — see guide-pages.js). So it has to match TipTap for
// the two bits of syntax plain marked doesn't know.
//
// Mirrors scripts/tiptap-viewer/src/text-colours.js (COLOURED_SPAN and the
// palette) — duplicated rather than required because the Dockerfile only
// ships app/, not scripts/. Keep the two in step.
const COLOURED_SPAN = /^\[((?:\\.|[^\]\\])+)\]\{\.([a-z]+)\}/
const COLOUR_CLASSES = {
  red: 'markdown-preview__text--red',
  blue: 'markdown-preview__text--blue'
}

// `[text]{.red}` — a coloured run; anything else stays as marked reads it.
const colouredSpan = {
  name: 'colouredSpan',
  level: 'inline',
  start: (source) => source.indexOf('['),
  tokenizer(source) {
    const match = COLOURED_SPAN.exec(source)
    if (!match || !COLOUR_CLASSES[match[2]]) return undefined
    return {
      type: 'colouredSpan',
      raw: match[0],
      className: COLOUR_CLASSES[match[2]],
      tokens: this.lexer.inlineTokens(match[1])
    }
  },
  renderer(token) {
    return `<span class="${token.className}">${this.parser.parseInline(token.tokens)}</span>`
  }
}

// `==text==` — TipTap's Highlight mark.
const highlight = {
  name: 'highlight',
  level: 'inline',
  start: (source) => source.indexOf('=='),
  tokenizer(source) {
    const match = /^==(?=\S)([\s\S]*?\S)==/.exec(source)
    if (!match) return undefined
    return {
      type: 'highlight',
      raw: match[0],
      tokens: this.lexer.inlineTokens(match[1])
    }
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`
  }
}

const marked = new Marked({ extensions: [colouredSpan, highlight] })

// A GFM cell can only be one line, so the converter writes a cell's list
// as `- one<br>- two`. TipTap's FaithfulTable (scripts/tiptap-viewer/src/
// tables.js) reads that back as a real list; this does the same for the
// server-rendered HTML — a cell whose lines from the first bullet on are
// all bullets gets them as a <ul>, anything else is left as it is.
const CELL = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g

function promoteCellLists(html) {
  return html.replace(CELL, (cell, tag, attributes, content) => {
    const lines = content.split(/<br\s*\/?>/)
    const first = lines.findIndex((line) => line.startsWith('- '))
    if (
      first < 0 ||
      !lines.slice(first).every((line) => line.startsWith('- '))
    ) {
      return cell
    }
    const lead = lines.slice(0, first).join('<br>')
    const items = lines
      .slice(first)
      .map((line) => `<li>${line.slice(2)}</li>`)
      .join('')
    return `<${tag}${attributes}>${lead ? `<p>${lead}</p>` : ''}<ul>${items}</ul></${tag}>`
  })
}

function renderMarkdownFallback(markdown) {
  return promoteCellLists(marked.parse(String(markdown || '')))
}

module.exports = { renderMarkdownFallback }
