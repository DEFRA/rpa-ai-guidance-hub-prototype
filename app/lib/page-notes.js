//
// Notes: a designer/dev annotation panel, inspired by "Alan" in
// defra-design/fcp-farming-front-door. Unlike Alan, notes are not duplicated
// into every page template — a page's notes live in a `*.notes.md` file
// sitting next to the template itself, e.g. app/views/v5/find-guidance/
// page.notes.md alongside page.njk.
//
// There is no runtime store: adding a note means hand-editing and committing
// that file, so this only ever reads it back, resolved per request rather
// than cached, so a newly-added notes file shows up without a restart.
//

const fs = require('fs')
const path = require('path')
const { marked } = require('marked')

const { templatePathFor, viewExtensions } = require('./view-paths')

const viewsDir = path.join(__dirname, '..', 'views')

// A leading --- ... --- block holding flat key: value pairs (status, url) —
// just enough to read two fields back out, not a general YAML parser.
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

function parseNotesFile(raw) {
  const match = raw.match(FRONT_MATTER)
  if (!match) return { body: raw }

  const [, frontMatter, body] = match
  const fields = {}

  frontMatter.split('\n').forEach((line) => {
    const separator = line.indexOf(':')
    if (separator === -1) return
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  })

  return { status: fields.status, url: fields.url, body }
}

// Mirrors how a URL is actually resolved to a view file. v5 mixes two
// conventions — some pages still render from app/views/versions/v5/... like
// every other version, others are page modules directly under
// app/views/v5/<page>/page.njk (see CLAUDE.md) — so both are tried, the
// versioned rewrite first since that's every other version's only option.
function resolveTemplateFile(urlPath) {
  const rewritten = templatePathFor(urlPath)
  const templatePaths = rewritten === urlPath ? [urlPath] : [rewritten, urlPath]

  for (const templatePath of templatePaths) {
    const candidates = [
      ...viewExtensions.map((extension) =>
        path.join(viewsDir, `${templatePath}${extension}`)
      ),
      path.join(viewsDir, templatePath, 'page.njk')
    ]

    const found = candidates.find((candidate) => fs.existsSync(candidate))
    if (found) return found
  }
}

function getPageNotes(urlPath) {
  const templateFile = resolveTemplateFile(urlPath)
  if (!templateFile) return null

  const notesFile = templateFile.replace(/\.(html|njk)$/, '.notes.md')
  if (!fs.existsSync(notesFile)) return null

  try {
    const { status, url, body } = parseNotesFile(
      fs.readFileSync(notesFile, 'utf8')
    )
    return { status, url, html: marked.parse(body) }
  } catch (error) {
    // A malformed notes file must never break the page it annotates.
    return null
  }
}

module.exports = { getPageNotes }
