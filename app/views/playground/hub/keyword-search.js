//
// The hub's search of every guide for words rather than a question: every
// section and part of every API guide holding them (anywhere in the text, in
// any case, as the guide page's own search finds them), the
// most matches first, then in guide and section order.
//
// Mock guides are left out: their content is placeholder (see page.notes.md).
//
const {
  matchesIn,
  searchTermOf
} = require('../../../assets/javascripts/keyword-matches')
const { loadApiGuideContent } = require('../guide/guide-content')

// Characters Markdown marks text up with, left out of a result's sentence.
const MARKUP = new Set(['#', '*', '_', '`', '>', '[', ']', '|', '\\'])

// What ends a sentence, when a space or the end of the line follows.
const SENTENCE_ENDS = new Set(['.', '?', '!'])

// The longest sentence shown whole; a longer one is cut around its match.
const LONGEST_SENTENCE = 300
const SENTENCE_REACH = 120

// A line without what the reader never sees: links' and images' addresses,
// "[text](address)" and "![alt](address)", which hold the guide's slug, and
// attributes such as "{.red}".
function withoutHidden(line) {
  let kept = ''
  let at = 0

  while (at < line.length) {
    if (line.startsWith('{.', at) && line.indexOf('}', at) !== -1) {
      at = line.indexOf('}', at) + 1
      continue
    }
    if (line.startsWith('](', at)) {
      const close = line.indexOf(')', at + 2)
      if (close !== -1) {
        kept += ']'
        at = close + 1
        continue
      }
    }
    if (!(line[at] === '!' && line[at + 1] === '[')) kept += line[at]
    at += 1
  }

  return kept
}

// A line of Markdown as plain text, with its spaces closed up.
function plainText(line) {
  const kept = [...withoutHidden(line)]
    .filter((character) => !MARKUP.has(character))
    .join('')
  return kept.trim().split(/\s+/).filter(Boolean).join(' ')
}

// A part's lines of text, its heading first, each marked as a heading or not.
function linesOf(part) {
  const heading = { text: plainText(part.heading || ''), heading: true }
  const body = (part.markdown || '').split('\n').map((line) => ({
    text: plainText(line),
    heading: line.trimStart().startsWith('#')
  }))
  return [heading, ...body].filter((line) => line.text)
}

function sentencesOf(text) {
  const sentences = []
  let from = 0

  for (let at = 0; at < text.length; at += 1) {
    const ends = at + 1 === text.length || text[at + 1] === ' '
    if (SENTENCE_ENDS.has(text[at]) && ends) {
      sentences.push(text.slice(from, at + 1).trim())
      from = at + 1
    }
  }

  const rest = text.slice(from).trim()
  return rest ? [...sentences, rest] : sentences
}

// A long sentence cut, at words, to the text around its first match.
function around(sentence, first) {
  if (sentence.length <= LONGEST_SENTENCE) return sentence

  const start = Math.max(first - SENTENCE_REACH, 0)
  const end = Math.min(first + SENTENCE_REACH, sentence.length)
  const from = start === 0 ? 0 : sentence.indexOf(' ', start) + 1
  const to = end === sentence.length ? end : sentence.lastIndexOf(' ', end)

  return (
    (from > 0 ? '…' : '') +
    sentence.slice(from, to) +
    (to < sentence.length ? '…' : '')
  )
}

// A sentence in parts, its matches marked, for the template to escape.
function partsOf(sentence, term) {
  const parts = []
  let from = 0

  for (const [start, end] of matchesIn(sentence, term)) {
    parts.push(
      { text: sentence.slice(from, start), match: false },
      { text: sentence.slice(start, end), match: true }
    )
    from = end
  }
  parts.push({ text: sentence.slice(from), match: false })

  return parts.filter((part) => part.text)
}

// The first sentence holding a match, in the text before the headings.
function snippetOf(lines, term) {
  const inOrder = [
    ...lines.filter((line) => !line.heading),
    ...lines.filter((line) => line.heading)
  ]
  const sentence = inOrder
    .flatMap((line) => sentencesOf(line.text))
    .find((candidate) => matchesIn(candidate, term).length)

  return partsOf(around(sentence, matchesIn(sentence, term)[0][0]), term)
}

// One guide's sections and parts holding the term, with how many times. None
// when its content can't be read.
async function matchingPartsOf(guide, term, keywords) {
  const content = await loadApiGuideContent(
    guide.apiId,
    guide.latestVersionId,
    guide.id
  )
  if (!content) return []

  const guideHref = '/playground/guide/' + encodeURIComponent(guide.id)

  return content.sections.flatMap((section) =>
    section.parts
      .map((part) => {
        const lines = linesOf(part)
        // Line by line: a phrase does not run on from one line into the next.
        const matches = lines.reduce(
          (count, line) => count + matchesIn(line.text, term).length,
          0
        )
        return { part, section, lines, matches }
      })
      .filter(({ matches }) => matches > 0)
      .map(({ part, section, lines, matches }) => {
        const anchor = part.isLead ? section.id : part.id
        return {
          text: part.heading || section.sectionName,
          href:
            guideHref +
            '/section/' +
            encodeURIComponent(anchor) +
            '?keywords=' +
            encodeURIComponent(keywords),
          documentTitle: guide.title,
          matches,
          snippet: snippetOf(lines, term)
        }
      })
  )
}

// Every API guide's sections and parts holding the search's words, for the
// hub page: { query, results }.
async function searchEveryGuide(query, apiGuides) {
  const term = searchTermOf(query)
  if (!term) return { query, results: [] }

  const found = await Promise.all(
    apiGuides.map((guide) => matchingPartsOf(guide, term, query.trim()))
  )

  // Array.prototype.sort is stable, so ties keep guide and section order.
  return {
    query,
    results: found.flat().sort((a, b) => b.matches - a.matches)
  }
}

module.exports = { searchEveryGuide }
