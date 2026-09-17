//
// Notes: a designer/dev annotation panel, inspired by "Alan" in
// defra-design/fcp-farming-front-door. Unlike Alan, notes are not duplicated
// into every page template — a page's notes live in a `*.notes.json` file
// sitting next to the template itself, e.g. app/views/v5/find-guidance/
// page.notes.json alongside page.njk.
//
// There is no runtime store: adding a note means hand-editing and committing
// that file, so this only ever reads it back, resolved per request rather
// than cached, so a newly-added notes file shows up without a restart.
//

const fs = require('fs')
const path = require('path')

const { templatePathFor, viewExtensions } = require('./view-paths')

const viewsDir = path.join(__dirname, '..', 'views')

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

  const notesFile = templateFile.replace(/\.(html|njk)$/, '.notes.json')
  if (!fs.existsSync(notesFile)) return null

  try {
    return JSON.parse(fs.readFileSync(notesFile, 'utf8'))
  } catch (error) {
    // A malformed notes file must never break the page it annotates.
    return null
  }
}

module.exports = { getPageNotes }
