//
// Runs as its own child process — spawned synchronously by
// guidance-loader.js's own loadGuidanceFromWordDocs (via execFileSync),
// never required directly by anything else — so it is free to use
// async/await for mammoth.convertToHtml, which has no synchronous API of
// its own (see guidance-loader.js's own top comment for why that matters
// here). Takes one or more absolute .docx file paths as argv, parses each
// with mammoth, and prints ONE JSON array of guidance-documents.js-shaped
// entries to stdout — the only thing this process ever writes to stdout;
// every diagnostic (a single file's own parse failure) goes to stderr
// instead, so it can never corrupt the JSON the parent process is about
// to JSON.parse.
//
// A single file failing to parse (corrupted, password-protected, not
// actually a valid .docx despite the extension) is skipped rather than
// aborting the whole batch — logged to stderr, the same "no error, no
// crash" standard guidance-loader.js's own comment documents for the
// Guidance-data folder itself not existing.
//

const path = require('path')
const mammoth = require('mammoth')

const filePaths = process.argv.slice(2)

// 'my-guidance.docx' -> 'my-guidance'. Matches the id convention every
// hardcoded entry in guidance-documents.js already uses (lower-case,
// hyphen-separated, no filename extension).
function slugify(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// mammoth HTML-escapes text content, and both title and description are
// stored as plain strings elsewhere in guidance-documents.js — Nunjucks
// escapes them again wherever they're rendered, so a title left as
// "Rules &amp; guidance" would show up on the page as
// "Rules &amp;amp; guidance". Decoding the handful of entities mammoth
// actually produces (no need for a full HTML-entity-decoding library just
// for this) undoes that, and stripping any remaining tags (e.g.
// <strong>text</strong> inside a heading) reduces it to the same kind of
// plain text every hardcoded title/description already is.
function htmlToPlainText(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function formatToday() {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
}

// title: the text of the first heading mammoth's own default style map
// produced — a Word paragraph styled "Heading 1"/"Heading 2"/etc becomes
// <h1>/<h2>/etc without any custom styleMap needed (mammoth's own
// documented default behaviour) — falling back to the filename (already
// computed by the caller) only when the document has no heading at all.
// description: the text of the first <p> AFTER that heading, not the
// first <p> in the whole document, in case anything precedes the title
// (a document-level note above it, say) — falling back to an empty
// string if there is no such paragraph either.
function extractTitleAndDescription(html, fallbackTitle) {
  const headingMatch = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/)
  const title = headingMatch ? htmlToPlainText(headingMatch[1]) : ''

  const searchFrom = headingMatch
    ? headingMatch.index + headingMatch[0].length
    : 0
  const paragraphMatch = html.slice(searchFrom).match(/<p[^>]*>([\s\S]*?)<\/p>/)
  const description = paragraphMatch ? htmlToPlainText(paragraphMatch[1]) : ''

  return { title: title || fallbackTitle, description }
}

async function parseOneDocx(filePath) {
  const fallbackTitle = path.basename(filePath, path.extname(filePath))

  try {
    const result = await mammoth.convertToHtml({ path: filePath })
    const { title, description } = extractTitleAndDescription(
      result.value,
      fallbackTitle
    )
    const today = formatToday()

    return {
      id: slugify(filePath),
      title,
      description,
      version: 'Version 1',
      lastUpdated: today,
      published: today,
      category: 'General',
      scheme: 'General',
      year: new Date().getFullYear(),
      showOnOrganicSearch: true,
      versions: {},
      steps: []
    }
  } catch (error) {
    process.stderr.write(
      '[guidance-loader-worker] skipping ' +
        filePath +
        ': ' +
        error.message +
        '\n'
    )
    return null
  }
}
;(async () => {
  const entries = await Promise.all(filePaths.map(parseOneDocx))
  process.stdout.write(JSON.stringify(entries.filter(Boolean)))
})().catch((error) => {
  process.stderr.write(
    '[guidance-loader-worker] fatal: ' + error.message + '\n'
  )
  process.exitCode = 1
})
