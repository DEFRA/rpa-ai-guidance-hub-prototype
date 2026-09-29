# Plan 1: TipTap Markdown viewer on the guide page

## Context

Guides are Word documents converted to Markdown by the API (`rpa-ai-guidance-hub-api`, `app/guidance/parsing/`). The API stores each guide as a directory holding `content.md` beside an `assets/` folder of images (`app/guidance/documents/store.py`, `ASSET_PREFIX = "assets/"`). The UI repo's `rai-72-word-to-markdown-conversion` branch (commit `6b7f2ba`) adds `scripts/preview-markdown/`, a Vite harness that renders that Markdown in a read-only TipTap `Editor`. Its extension list (`extensions.js`) is the schema the real guidance editor will ship with.

The goal: a guide with a converted `content.md` renders on the guide page through **that same schema**, so research shows what production will show. The stepper, traditional view, contents list, pagination and side panel keep working, and guides without Markdown render from their structured JS content exactly as before.

**Decisions**
- **Content:** sample `.md` files committed to the repo, in the API's store layout.
- **Runtime:** a prebuilt, committed browser bundle. The Prototype Kit has no bundler, so bare `@tiptap/*` imports can't be served.
- **Structure:** Markdown is split at its headings into the existing sections/parts shape.
- **No-JS:** a server-rendered HTML fallback that matches TipTap's output.

### What's taken from upstream, and what's left behind

- **Taken (about 430 lines, byte-for-byte):**
  - `extensions.js` is the schema: StarterKit with underline off, Image, `FaithfulTable`, TableRow/Cell/Header, Markdown, `MarkdownTextStyle`, `ClassColor` and Highlight.
  - `tables.js` makes a table cell read back the same as it was written, including `- a<br>- b` cell lists becoming real lists.
  - `coloured-text.js` and `text-colours.js` handle `[text]{.red}` colour runs, painted with a class rather than an inline style (the CSP-safe approach).
  - Packages are pinned to `@tiptap/*@3.29.2`.
- **Left behind:** `server.js` (Vite), `main.js`, `panes.js`, `sync.js`, `diff.js`, `normalise.js`/jsdom and `styles.css`. Together they're a source/diff/render comparison tool, not a reader.

### Converter output to expect

- **Headings:** `hashes = "#" * (self.level + 1)` in `models.py`, so top-level sections are `## 1 Heading` and subsections `### 1.1 Heading`. Headings are numbered, with no bold.
- **Images:** `![alt](assets/<digest>.png)`, sometimes `../assets/…`.
- **Colour:** Pandoc-style spans, `[\[SBI\]]{.red}`, with the palette in `text-colours.js`.
- **Table cell lists:** `- one<br>- two`, since GFM rows are single-line.

## To do

**Dependencies and build**
- [ ] 1. Add the eight `@tiptap/*@3.29.2` packages and `esbuild` as **dev** dependencies, and add the `build:tiptap` script to `package.json`.
- [ ] 2. Create `scripts/tiptap-viewer/src/` and copy in `extensions.js`, `coloured-text.js`, `tables.js` and `text-colours.js` from the Appendix. Prepend only the one-line source header.
- [ ] 3. Write `scripts/tiptap-viewer/src/viewer.js`: mount a read-only `Editor` on each `[data-tiptap-markdown]` element that has a JSON `<script>` child.
- [ ] 4. Write `scripts/tiptap-viewer/build.js`, a single-file esbuild bundle with no source map, output to `app/assets/javascripts/vendor/tiptap-viewer.js`.
- [ ] 5. Write `scripts/tiptap-viewer/README.md` covering provenance, rebuild and re-sync.
- [ ] 6. Add the vendor bundle, the four upstream files and `app/data/guides/` to `.prettierignore`.
- [ ] 7. Run `npm install && npm run build:tiptap`, then commit the built bundle.

**Content and data**
- [ ] 8. Add a sample guide, `app/data/guides/sfi-nutrient-management-actions/content.md` plus `assets/`, in the converter's shape: `## 1 …`, `### 1.1 …`, a table with a cell list, colour spans, a highlight and an image.
- [ ] 9. Write `app/data/guide-markdown.js`: `readGuideMarkdown`, `splitGuideMarkdown` (with a lead part per section and asset-path rewriting) and `guideAssetPath` (with the traversal guard).
- [ ] 10. In `app/data/guide-content.js`:
  - Markdown sections take precedence and set `isMarkdown`;
  - pass `markdown` and `isLead` through `fromSections`;
  - add and export `loadGuideContent(id)`.

**Rendering**
- [ ] 11. Write `app/lib/markdown-fallback.js`, a `Marked` instance with colour span and highlight extensions, plus `promoteCellLists`.
- [ ] 12. Add the `jsonScript` and `markdownFallback` filters to `app/filters.js`.
- [ ] 13. In `guide/view-model.js`:
  - use `loadGuideContent(id)`;
  - guard `resolveBody` for non-arrays;
  - return `isMarkdown`.
- [ ] 14. In `partials/reading-content.njk`, add the Markdown branch in `renderPart`: a JSON `<script>` (when `live`) plus the fallback `<div>`.
- [ ] 15. In `page.njk`, load `vendor/tiptap-viewer.js` in `pageScripts` when `isMarkdown`.
- [ ] 16. Add the `guide/assets/routes.js` route: `GET /:id/assets/:file` via `guideAssetPath`, returning 404 otherwise.
- [ ] 17. Add `_app-guide-markdown.scss` and import it in `application.scss` after `app-guide`.

**Finish**
- [ ] 18. Run every step in Verification below.
- [ ] 19. Add a dated entry to `guide/page.notes.md`, then run `npm run format`.

## Resulting structure

```
package.json                                  edit — @tiptap/* + esbuild devDeps, build:tiptap script
.prettierignore                               edit — vendor/, the 4 upstream files, app/data/guides/
scripts/tiptap-viewer/
  README.md                                   new — provenance, rebuild, re-sync
  build.js                                    new — esbuild → app/assets/javascripts/vendor/tiptap-viewer.js
  src/
    viewer.js                                 new — mounts a read-only Editor per [data-tiptap-markdown]
    extensions.js, coloured-text.js,
    tables.js, text-colours.js                copied verbatim (+1 header line) — see Appendix
app/assets/javascripts/vendor/tiptap-viewer.js   BUILT + committed (~554 KB minified, no source map)
app/assets/sass/application.scss              edit — @import 'components/app-guide-markdown' after app-guide
app/assets/sass/components/_app-guide-markdown.scss   new — GOV.UK typography for TipTap/fallback output
app/data/guides/<id>/content.md + assets/     new — sample converted guide
app/data/guide-markdown.js                    new — read, split into sections/parts, asset paths, asset guard
app/data/guide-content.js                     edit — Markdown sections take precedence; loadGuideContent(id)
app/lib/markdown-fallback.js                  new — server-rendered HTML matching TipTap
app/filters.js                                edit — jsonScript + markdownFallback filters
app/views/playground/guide/
  view-model.js                               edit — use loadGuideContent; isMarkdown; guard resolveBody
  page.njk                                    edit — load the bundle when isMarkdown
  partials/reading-content.njk                edit — Markdown branch in renderPart
  assets/routes.js                            new — GET /playground/guide/:id/assets/:file
  page.notes.md                               edit — dated entry
```

## Files in detail

### `package.json`
```json
"scripts": { "build:tiptap": "node scripts/tiptap-viewer/build.js" },
"devDependencies": {
  "@tiptap/core": "3.29.2", "@tiptap/extension-highlight": "3.29.2",
  "@tiptap/extension-image": "3.29.2", "@tiptap/extension-table": "3.29.2",
  "@tiptap/extension-text-style": "3.29.2", "@tiptap/markdown": "3.29.2",
  "@tiptap/pm": "3.29.2", "@tiptap/starter-kit": "3.29.2",
  "esbuild": "0.28.2"
}
```
These are dev-only: runtime serves the committed bundle, so the CDP container installs nothing new.

### `.prettierignore` additions
```
app/assets/javascripts/vendor/
scripts/tiptap-viewer/src/extensions.js
scripts/tiptap-viewer/src/coloured-text.js
scripts/tiptap-viewer/src/tables.js
scripts/tiptap-viewer/src/text-colours.js
app/data/guides/
```
- The upstream files use neostandard style, and Prettier would rewrite them, breaking re-sync diffs.
- `content.md` should stay as the converter wrote it.
- `vendor/` already failed the check through accessible-autocomplete.

### `scripts/tiptap-viewer/build.js`
```js
const path = require('node:path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '..', '..')

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src', 'viewer.js')],
    outfile: path.join(ROOT, 'app', 'assets', 'javascripts', 'vendor', 'tiptap-viewer.js'),
    bundle: true,
    format: 'iife',
    minify: true,
    // Off: the map is ~3MB, too heavy to commit for a prototype.
    sourcemap: false,
    target: ['es2020'],
    legalComments: 'linked',
    logLevel: 'info'
  })
  .catch(() => {
    process.exitCode = 1
  })
```
No CSS is bundled: `prosemirror-view/style/prosemirror.css` is almost all about editing, and the few rules a read-only view needs go in the SCSS.

### `scripts/tiptap-viewer/src/viewer.js`
```js
import { Editor } from '@tiptap/core'

import { EXTENSIONS } from './extensions.js'

// One read-only Editor per [data-tiptap-markdown] mount point. The Markdown
// arrives JSON-encoded in a child <script>, never as HTML, since it's
// converted Word content. `data-tiptap-editable="true"` is left as a hook
// for a future editing flow.
function mount(element) {
  const source = element.querySelector('script[type="application/json"]')
  if (!source) return null

  const markdown = JSON.parse(source.textContent)
  const target = document.createElement('div')
  // Replaces the server-rendered no-JS fallback.
  element.replaceChildren(target)

  return new Editor({
    element: target,
    extensions: EXTENSIONS,
    content: markdown,
    contentType: 'markdown',
    editable: element.dataset.tiptapEditable === 'true'
  })
}

document.querySelectorAll('[data-tiptap-markdown]').forEach(mount)
```
- **Mount rule:** only elements with a JSON `<script>` child mount. Plan 6 relies on this, because hidden stepper pages omit the script so they keep their server-rendered HTML.
- **Read-only:** `editable: false` makes ProseMirror render `contenteditable="false"`, so the output reads as normal content to assistive tech.

### `scripts/tiptap-viewer/README.md`
Covers what the viewer is, the upstream path and commit, and how to rebuild (`npm run build:tiptap`, then commit the bundle). To re-sync: copy the four files again with the header line updated to the new commit, match the `@tiptap/*` versions, rebuild and commit.

### Sample guide: `app/data/guides/sfi-nutrient-management-actions/content.md`
- **Why this id:** it's the upload journey's `CONVERTED_GUIDE_ID` (`upload/view-model.js`), so "View the guidance" lands on a Markdown guide. It already has overview, version and metadata data in `manage-guidance.js`.
- **Content:** written in the converter's shape:
  - `## 1 Overview`, `### 1.1 Who this guide is for` and so on across 3 sections and 7 subsections;
  - bullet and numbered lists and a blockquote;
  - a GFM table with a `- a<br>- b` cell list;
  - `[\[SBI\]]{.red}` spans, a `==highlight==` and one image, `![…](assets/nutrient-review-stages.svg)`.
- **Rules:** made-up content only, with no real personal data. Real converted output is better if some is safe to commit.

### `app/data/guide-markdown.js` (new)
~~~js
const fs = require('node:fs')
const path = require('node:path')

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
  return raw.replace(/\*\*|__/g, '').replace(/\\(.)/g, '$1').trim()
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
    if (match) headings.push({ index, level: match[1].length, text: match[2] })
  })
  return headings
}

// Splits a guide into [{ sectionName, parts: [{ heading, markdown, isLead }] }]
// — the raw shape guide-content.js's fromSections() already numbers. The
// shallowest heading level present is a section, the next one down is a
// part; deeper headings stay inside their part's Markdown for TipTap. Every
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
      parts: [{ heading: 'Introduction', markdown: leading.join('\n').trim(), isLead: true }]
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
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null
  return fs.existsSync(resolved) ? resolved : null
}

module.exports = { readGuideMarkdown, splitGuideMarkdown, guideAssetPath }
~~~

> **Gotcha:** the first version created a lead part only when a section had lead-in text. That meant a section with none ("2 Checking the claim" → straight to "2.1 …") never showed its own name in the body. The traditional template renders a section's first part as the section heading, so "2.1" took that slot. Always creating the lead part (empty `markdown` if needed) fixes it, and `isLead` keeps it out of the contents sub-list.

### `app/data/guide-content.js` (edit)
- **Imports:** require `./guidance-documents` and `./guide-markdown`.
- **`buildGuideContent(guidanceDocument, markdownSections)`:** takes Markdown sections first:
  ```js
  if (markdownSections && markdownSections.length) {
    return { ...fromSections(markdownSections), isMarkdown: true }
  }
  ```
- **`fromSections`:** passes `markdown: part.markdown` and `isLead: Boolean(part.isLead)` through alongside `body`.
- **`loadGuideContent`:** new and exported, so other modules (bookmark, section, position) can resolve a guide's content without the view model:
  ```js
  function loadGuideContent(id) {
    const guidanceDocument = guidanceDocuments.find((candidate) => candidate.id === id)
    const markdown = readGuideMarkdown(id)
    const content = buildGuideContent(
      guidanceDocument,
      markdown ? splitGuideMarkdown(markdown, id) : null
    )
    return { guidanceDocument, content }
  }
  ```

### `app/lib/markdown-fallback.js` (new): server-rendered HTML matching TipTap
It's used for the no-JS view, and in Plan 6 for hidden stepper pages that find-in-page reveals, so it has to look like TipTap's output. The regex and palette are **duplicated** from `text-colours.js` rather than required: the file loads fine on Node 22.12+/24 via `require(esm)`, but the Dockerfile doesn't ship `scripts/`.

```js
const { Marked } = require('marked')

const COLOURED_SPAN = /^\[((?:\\.|[^\]\\])+)\]\{\.([a-z]+)\}/
const COLOUR_CLASSES = {
  red: 'markdown-preview__text--red',
  blue: 'markdown-preview__text--blue'
}

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

const highlight = {
  name: 'highlight',
  level: 'inline',
  start: (source) => source.indexOf('=='),
  tokenizer(source) {
    const match = /^==(?=\S)([\s\S]*?\S)==/.exec(source)
    if (!match) return undefined
    return { type: 'highlight', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) }
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`
  }
}

const marked = new Marked({ extensions: [colouredSpan, highlight] })

// Mirrors tables.js's promote(): a cell whose lines from the first bullet
// on are all bullets gets them as a <ul>; anything else is left alone.
const CELL = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g

function promoteCellLists(html) {
  return html.replace(CELL, (cell, tag, attributes, content) => {
    const lines = content.split(/<br\s*\/?>/)
    const first = lines.findIndex((line) => line.startsWith('- '))
    if (first < 0 || !lines.slice(first).every((line) => line.startsWith('- '))) {
      return cell
    }
    const lead = lines.slice(0, first).join('<br>')
    const items = lines.slice(first).map((line) => `<li>${line.slice(2)}</li>`).join('')
    return `<${tag}${attributes}>${lead ? `<p>${lead}</p>` : ''}<ul>${items}</ul></${tag}>`
  })
}

function renderMarkdownFallback(markdown) {
  return promoteCellLists(marked.parse(String(markdown || '')))
}

module.exports = { renderMarkdownFallback }
```
Expected output of the three extensions:
- `[\[SBI\]]{.red}` becomes `<span class="markdown-preview__text--red">[SBI]</span>`.
- `[x]{.mauve}` and `[link](/x)` are left alone.
- `==a==` becomes `<mark>a</mark>`.
- `Do this:<br>- a<br>- b` in a cell becomes `<p>Do this:</p><ul><li>a</li><li>b</li></ul>`.

### `app/filters.js` (edit)
```js
const { renderMarkdownFallback } = require('./lib/markdown-fallback')

// JSON for a <script type="application/json"> block. Every "<" is escaped
// so content containing "</script>" can't end the block early.
addFilter('jsonScript', (value) => JSON.stringify(value).replace(/</g, '\\u003c'), {
  renderAsHtml: true
})

addFilter('markdownFallback', renderMarkdownFallback, { renderAsHtml: true })
```
`marked` doesn't sanitise HTML. That's acceptable here because it only renders committed sample content, the same trust level as `page-notes.js`. **In the real service, sanitise it** (DOMPurify or similar), since uploads are untrusted.

### `app/views/playground/guide/view-model.js` (edit)
- **Content:** `const { guidanceDocument, content } = loadGuideContent(id)` replaces the inline lookup.
- **`resolveBody`:** guarded, because Markdown parts have no `body` and never branch: `if (!Array.isArray(body)) return body`.
- **Return value:** add `isMarkdown: Boolean(content.isMarkdown)`.

### `partials/reading-content.njk` (edit, inside `renderPart` after the heading)
```njk
{% if part.markdown %}
  <div class="app-guide-markdown app-guide-body-text" data-tiptap-markdown>
    {% if live %}<script type="application/json">{{ part.markdown | jsonScript }}</script>{% endif %}
    <div class="app-guide-markdown__fallback">{{ part.markdown | markdownFallback }}</div>
  </div>
{% endif %}
{% for entry in part.body %} …existing JS-content rendering… {% endfor %}
```
- `{% if part.markdown %}`, not `is defined`, so an empty lead part renders its heading only.
- `live` is added by Plan 6 and defaults to `true`.

### `page.njk` (edit, `pageScripts` block)
```njk
{% if isMarkdown %}<script src="/public/javascripts/vendor/tiptap-viewer.js"></script>{% endif %}
```

### `guide/assets/routes.js` (new, routes-only tier)
```js
const govukPrototypeKit = require('govuk-prototype-kit')
const { guideAssetPath } = require('../../../../data/guide-markdown')

const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.get('/:id/assets/:file', (req, res) => {
  const file = guideAssetPath(req.params.id, req.params.file)
  if (!file) {
    res.sendStatus(404)
    return
  }
  res.sendFile(file)
})
```
- **Traversal:** Express decodes `:file`, so `..%2F..` arrives as `../..`. The guard in `guideAssetPath` is what stops it.
- **Route clash:** there's none with `guide/routes.js`'s `/:id`, which is a single path segment.

### `_app-guide-markdown.scss` (new, imported after `_app-guide.scss`)
Scoped to `.app-guide-markdown`, so the rules cover **both** TipTap's `.ProseMirror` output and the fallback, and nothing shifts when the viewer takes over.
- **ProseMirror base:** `.ProseMirror { white-space: pre-wrap; word-wrap: break-word; outline: none; }`.
- **Headings:** `h2`/`h3` are 19px bold, `h4`–`h6` 16px bold, with `govuk-spacing(4)` above and `(2)` below.
- **Text and lists:** `p`, `ul` and `ol` get `margin: 0 0 govuk-spacing(4)`, and lists get `padding-left: govuk-spacing(4)`.
- **Links:** `@include govuk-link-common; @include govuk-link-style-default;`.
- **Tables:** the govuk-table look, since the Markdown carries no classes: 100% width, collapsed borders, 16px text, `1px solid $govuk-border-colour` bottom borders, and `p`/`ul` margins zeroed inside cells.
  - **Gotcha:** TipTap wraps cell text in `<p>`, which resets `th`'s bold, so style `th, th p { font-weight: 700 }`.
- **Media and callouts:**
  - `img { display: block; max-width: 100%; height: auto; }`;
  - `blockquote` gets the govuk-inset-text look (`$govuk-border-width-wide` left border);
  - `mark { background-color: govuk-colour('yellow') }`.
- **Colour classes:** `.markdown-preview__text--red { color: govuk-colour('red'); font-weight: 700 }` and `--blue { color: govuk-colour('blue') }`. The prefix is upstream's, kept so the copied files stay verbatim.

## Verification
1. **Build:** run `npm install`, then `npm run build:tiptap`. The bundle builds with no unresolved imports.
2. **Stepper view:** on `/playground/guide/sfi-nutrient-management-actions`, check:
   - the viewer mounts (`.ProseMirror` present, `contenteditable="false"`) and the fallback is gone;
   - the table's cell list is a real `<ul>`, the red `[SBI]` has the class, and the image loads;
   - the console is empty.
3. **Traditional view:** `?format=traditional` mounts every part, and the contents anchors resolve.
4. **No-JS:** with JS disabled, the fallback shows, including colour, highlight and cell lists.
5. **Other guides unchanged:** a JS-content guide such as `cs-revenue-claims-processing-final-payment-guide` renders as before. Diffing its `<main>` before and after showed whitespace only.
6. **Assets route:** `/assets/nutrient-review-stages.svg` returns 200 as `image/svg+xml`. `assets/..%2Fcontent.md` returns 404.
7. **Checks:** run `npm run format:check`.

## Appendix: code copied verbatim from the UI repo

From `rpa-ai-guidance-hub-ui/scripts/preview-markdown/` at `6b7f2ba` (branch `rai-72-word-to-markdown-conversion`). Each goes to `scripts/tiptap-viewer/src/<same name>` with one header line prepended (shown on each file below).

### `extensions.js`

```js
// Copied verbatim from rpa-ai-guidance-hub-ui scripts/preview-markdown/extensions.js @ 6b7f2ba — re-sync, do not edit.
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'

import { ClassColor, MarkdownTextStyle } from './coloured-text.js'
import { FaithfulTable } from './tables.js'

// The extension list is the schema, and the schema decides what the preview can
// show: anything it cannot model is dropped as the document is read in. So a
// construct missing from the page is as likely to be absent from this list as it
// is to be missing from the parser's Markdown -- check here first.
//
// It is deliberately the set the guidance editor is expected to ship with, so what
// the preview shows is what a designer would really see. When that editor lands in
// `src/`, this list is what it should be built from, which is why it sits in its
// own file rather than inline in the page.

// Underline is off because the editor this list seeds must not turn it on: the
// serialiser emits `++text++`, which is not Markdown, so a reader's renderer would
// show the plus signs literally. The visible consequence here is that `<u>` runs in
// a converted document render as plain text.
const EXTENSIONS = [
  StarterKit.configure({ underline: false }),
  Image,
  // The stock Table pads its Markdown with a blank line at each end, welds the
  // blocks of a multi-block cell together, and reads a cell's list back as a
  // paragraph wearing hyphens. See `tables.js`.
  FaithfulTable,
  TableRow,
  TableCell,
  TableHeader,
  Markdown,
  // Colour has no Markdown syntax of its own, so it is carried as a bracketed span
  // -- `[text]{.red}` -- which these two halves define between them: the mark owns
  // the Markdown, and the Color variant owns what the browser paints. Both are the
  // real thing rather than a preview stand-in, because the stock pair loses a
  // coloured run on the first save and could not render it under the application's
  // CSP anyway. See `coloured-text.js`.
  MarkdownTextStyle,
  ClassColor,
  Highlight
]

export { EXTENSIONS }
```

### `coloured-text.js`

```js
// Copied verbatim from rpa-ai-guidance-hub-ui scripts/preview-markdown/coloured-text.js @ 6b7f2ba — re-sync, do not edit.
/**
 * @fileoverview The two extensions that make a coloured run survive the round trip.
 *
 * Colour is not a mark of its own in Tiptap's schema: it is an attribute on
 * `textStyle`, and `@tiptap/extension-text-style` ships no Markdown spec at all. The
 * serialiser's response to a mark it has no handler for is an empty delimiter rather
 * than an error, so a coloured run is dropped in silence on the first save. That is
 * the shipped default, not a bug, and it means there is no upstream convention to
 * inherit -- the syntax in `text-colours.js` is one we define.
 *
 * Writing it as inline HTML was tried first and is worse than it looks. `marked`
 * hands inline HTML to Tiptap's `parseHTMLToken`, which runs it through an HTML
 * parse, so Markdown inside a `<span>` stops being Markdown: the page renders
 * correctly, the editor gets literal asterisks back, and the *next* save stores
 * them. A bracketed span avoids that because its contents are re-tokenised as
 * Markdown -- see `inlineTokens` below.
 */

import { Color, TextStyle } from '@tiptap/extension-text-style'

import {
  COLOURED_SPAN,
  colourClass,
  colourHex,
  colourModifier
} from './text-colours.js'

/**
 * The Markdown contract for a coloured run.
 *
 * It has to sit on `TextStyle` rather than on `Color`: the serialiser looks its
 * handlers up by mark name, and `Color` is an Extension contributing a global
 * attribute rather than a mark of its own.
 */
const MarkdownTextStyle = TextStyle.extend({
  markdownTokenizer: {
    name: 'textStyle',
    level: 'inline',
    start: (source) => source.indexOf('['),

    tokenize (source, _tokens, helpers) {
      const match = COLOURED_SPAN.exec(source)
      if (!match) {
        return undefined
      }

      const [raw, text, modifier] = match
      const colour = colourHex(modifier)
      if (!colour) {
        // Not one of ours. Declining leaves an ordinary link, and a class nobody
        // defined, as the literal text they are.
        return undefined
      }

      // Tokenising the span's own text is the line that keeps everything inside it
      // Markdown, so `[**bold**]{.red}` is still bold after a save and a reopen.
      return {
        type: 'textStyle',
        raw,
        text,
        colour,
        tokens: helpers.inlineTokens(text)
      }
    }
  },

  parseMarkdown: (token, helpers) =>
    helpers.applyMark('textStyle', helpers.parseInline(token.tokens ?? []), {
      color: token.colour
    }),

  renderMarkdown: (node, helpers) => {
    const content = helpers.renderChildren(node)
    const modifier = colourModifier(node.attrs?.color)
    return modifier ? `[${content}]{.${modifier}}` : content
  }
})

/**
 * The browser rendering: a class beside the library's inline style.
 *
 * The application sets `style-src 'self'` with no `'unsafe-inline'`, and
 * `style-src-attr` falls back to it, so the inline style the stock extension writes
 * does not apply in the real application at all. A nonce cannot rescue a style
 * attribute either. The style is left in place so that a colour outside the palette
 * still shows up somewhere it is not blocked; the class is what paints the page.
 */
const ClassColor = Color.extend({
  addGlobalAttributes () {
    const [group] = this.parent?.() ?? []

    return [
      {
        ...group,
        attributes: {
          ...group.attributes,
          color: {
            ...group.attributes.color,
            renderHTML: (attributes) => {
              const rendered = group.attributes.color.renderHTML(attributes)
              const modifier = colourModifier(attributes.color)
              const painted = modifier ? colourClass(modifier) : null
              return painted ? { ...rendered, class: painted } : rendered
            }
          }
        }
      }
    ]
  }
})

export { ClassColor, MarkdownTextStyle }
```

### `tables.js`

```js
// Copied verbatim from rpa-ai-guidance-hub-ui scripts/preview-markdown/tables.js @ 6b7f2ba — re-sync, do not edit.
/**
 * @fileoverview The table extension, corrected so that a cell means the same thing
 * on the way out as it did on the way in.
 *
 * Three corrections, all of them about the fact that a GFM pipe row is a single
 * line and a cell is not. The stock extension writes a cell's blocks joined by
 * `<br>`, which is the only thing the format allows -- and then reads that `<br>`
 * back as nothing but a line break, so structure survives the write and is lost on
 * the next read.
 *
 * 1. `renderMarkdown` trims the table's own blank lines. `renderTableToMarkdown`
 *    opens with `let out = "\n"` and ends every row with a newline, so a serialised
 *    table carries a blank line at each end. The serialiser then puts its own blank
 *    line between top-level blocks on top of those, and the total depends on what a
 *    table sits next to: beside a paragraph the stray is absorbed into the one
 *    separator a paragraph needs; between two tables both strays stack and the gap
 *    becomes three blank lines. Read back, three blank lines are one blank line
 *    *plus* an empty paragraph -- which serialises to two more on the next save, and
 *    two more after that, so a document holding two adjacent tables grows every time
 *    it is saved. Trimming makes a table render like every other block and leaves
 *    the separator to do the separating.
 *
 * 2. `renderChildren` is given each block of a multi-block cell, and unwraps a node
 *    to its own children rather than running the node's handler -- joining them with
 *    the empty string. A cell holding a paragraph and a list therefore comes back as
 *    `Do this:<br>- one- two`: the items welded together, the line breaks between
 *    them gone. It is silent, because a damaged cell is a single paragraph again on
 *    the next read and so the *second* save matches the first. Idempotent and wrong.
 *
 * 3. `parseMarkdown` promotes a cell whose text is a list back into a list. This is
 *    the read that (2) makes safe, and the pair is what closes the loop: the stock
 *    serialiser already writes a cell-level list as `- one<br>- two`, so reading
 *    that form back as a list makes the cell a fixed point -- the same Markdown, but
 *    a real list in the editor rather than a paragraph wearing hyphens. Nothing in
 *    the document changes; what changes is that whoever edits the cell gets list
 *    behaviour, and the converter needs no special case for it.
 *
 * All three are upstream behaviour rather than anything the converter does: the
 * Markdown a converted document arrives as has the single blank line CommonMark asks
 * for, and writes its cell lists in exactly the form (3) reads.
 */

import { Table, renderTableToMarkdown } from '@tiptap/extension-table'

const MARKER = '- '

/**
 * Split a paragraph's inline content on its hard breaks.
 *
 * @param {object[]} content
 * @returns {object[][]} one group per line, in order
 */
function lines (content) {
  const split = [[]]

  for (const child of content) {
    if (child.type === 'hardBreak') {
      split.push([])
    } else {
      split[split.length - 1].push(child)
    }
  }

  return split
}

/**
 * Whether a line opens with a bullet marker that is text rather than emphasis.
 *
 * A marked-up marker -- `**- one**` -- is not something the converter writes for a
 * list, so it is left as the text it is.
 *
 * @param {object[]} line
 * @returns {boolean}
 */
function isItem (line) {
  const [first] = line

  return (
    first?.type === 'text' && !first.marks?.length && first.text.startsWith(MARKER)
  )
}

/**
 * One bulleted line as a list item, with the marker taken off its text.
 *
 * @param {object[]} line
 * @returns {object} a `listItem` node
 */
function item (line) {
  const [first, ...rest] = line
  const text = first.text.slice(MARKER.length)
  // `- [a link](...)` leaves nothing behind, and an empty text node is not a node.
  const content = text ? [{ ...first, text }, ...rest] : rest

  return { type: 'listItem', content: [{ type: 'paragraph', content }] }
}

/**
 * Rejoin lines that stay a paragraph, restoring the breaks between them.
 *
 * @param {object[][]} kept
 * @returns {object} a `paragraph` node
 */
function paragraph (kept) {
  return {
    type: 'paragraph',
    content: kept.flatMap((line, index) =>
      index ? [{ type: 'hardBreak' }, ...line] : line
    )
  }
}

/**
 * A cell with any trailing run of bulleted lines turned into a list.
 *
 * Deliberately all-or-nothing from the first bullet on: a cell that goes back to
 * prose after a bullet is not a list with a stray paragraph in it, it is prose that
 * happens to contain a hyphen, so it is left alone.
 *
 * @param {object} cell
 * @returns {object} the cell, promoted if it qualifies
 */
function promote (cell) {
  if (cell.content?.length !== 1 || cell.content[0].type !== 'paragraph') {
    return cell
  }

  const split = lines(cell.content[0].content ?? [])
  const first = split.findIndex(isItem)

  if (first < 0 || !split.slice(first).every(isItem)) {
    return cell
  }

  const list = { type: 'bulletList', content: split.slice(first).map(item) }
  const lead = split.slice(0, first)

  return { ...cell, content: lead.length ? [paragraph(lead), list] : [list] }
}

/**
 * @param {object} node
 * @returns {object} the same tree, with every cell in it promoted
 */
function promoteCells (node) {
  if (node.type === 'tableCell' || node.type === 'tableHeader') {
    return promote(node)
  }

  return node.content ? { ...node, content: node.content.map(promoteCells) } : node
}

/**
 * The render helpers, with `renderChildren` made to render a node it is handed
 * rather than the node's children.
 *
 * The table renderer passes each block of a multi-block cell to `renderChildren`,
 * which is built for a fragment: given a node it drops to `node.content` and joins
 * with the empty string, so a list arrives as its items with nothing between them.
 * `renderChild` is the one that runs the node's own handler. The index it takes
 * places a node among its siblings for handlers that look backwards, and a cell's
 * blocks are not siblings of anything the table renderer names -- the parent it
 * supplies is the table -- so there is no meaningful index to pass.
 *
 * @param {object} helpers
 * @returns {object} the same helpers, fixed
 */
function perBlock (helpers) {
  return {
    ...helpers,
    renderChildren: (nodes, separator) =>
      Array.isArray(nodes)
        ? helpers.renderChildren(nodes, separator)
        : helpers.renderChild(nodes, 0)
  }
}

const FaithfulTable = Table.extend({
  // Wrapped rather than reimplemented: the stock parse is thirty lines of header,
  // alignment and row handling that this has no opinion about, and only the shape of
  // a finished cell to change.
  parseMarkdown: (token, helpers) =>
    promoteCells(Table.config.parseMarkdown(token, helpers)),
  renderMarkdown: (node, helpers) =>
    renderTableToMarkdown(node, perBlock(helpers)).trim()
})

export { FaithfulTable }
```

### `text-colours.js`

```js
// Copied verbatim from rpa-ai-guidance-hub-ui scripts/preview-markdown/text-colours.js @ 6b7f2ba — re-sync, do not edit.
/**
 * @fileoverview The colour palette the guidance editor carries, and the Markdown
 * syntax that carries it.
 *
 * Markdown has no syntax for colour, so a coloured run is written as a Pandoc-style
 * bracketed span -- `[text]{.red}`. Only the modifier in the braces is ever stored:
 * the editor maps it to a hex to colour the mark, and a renderer maps it to a class
 * to colour the page, so neither a hex nor a class name is baked into a document and
 * the palette can be restyled without rewriting content.
 *
 * This file is the single definition of both. The syntax has to be implemented once
 * for the editor and once for whatever renders a published page, and two regexes
 * drifting apart is the obvious failure mode, so neither end owns it.
 */

// The parser matches every colour a Word document carries to one of these, so the
// list is the whole vocabulary a converted document can use.
const TEXT_COLOURS = [
  { modifier: 'red', hex: '#d4351c', name: 'Red text' },
  { modifier: 'blue', hex: '#1d70b8', name: 'Blue text' }
]

/**
 * One coloured span, anchored: a tokenizer is handed the rest of the source and
 * must only claim a span starting exactly where it is looking.
 *
 * The inner text allows an escaped character, which a naive `[^\]]+` does not. That
 * matters more than it sounds: a converted document escapes the brackets an author
 * typed, so `[SBI]` in red arrives as `[\[SBI\]]{.red}`, and a class stopping at the
 * first `]` would decline the span and drop the colour on every placeholder written
 * that way. Escaping is not the problem -- an unescaped `[[SBI]]{.red}` fails the
 * same way -- so the alternation is what has to be here.
 *
 * A link inside a coloured run is still out of scope: its `](` would need balanced
 * matching rather than one more alternative. Nothing produces one, because Word
 * paints its own colour on every hyperlink and the parser drops it.
 */
const COLOURED_SPAN = /^\[((?:\\.|[^\]\\])+)\]\{\.([a-z]+)\}/

const CLASS_PREFIX = 'markdown-preview__text--'

const HEX_BY_MODIFIER = new Map(
  TEXT_COLOURS.map(({ hex, modifier }) => [modifier, hex])
)

const MODIFIER_BY_HEX = new Map(
  TEXT_COLOURS.map(({ hex, modifier }) => [hex, modifier])
)

/**
 * The modifier naming a colour, or null if it is not one of ours.
 *
 * @param {string} hex
 * @returns {string|null}
 */
function colourModifier (hex) {
  return MODIFIER_BY_HEX.get(hex) ?? null
}

/**
 * The colour a modifier names, or null if it is not one of ours.
 *
 * Returning null is what lets a tokenizer decline a span it does not recognise,
 * which is what leaves an ordinary `[link](/x)` -- and a `{.mauve}` nobody defined --
 * as the literal text they are.
 *
 * @param {string} modifier
 * @returns {string|null}
 */
function colourHex (modifier) {
  return HEX_BY_MODIFIER.get(modifier) ?? null
}

/**
 * The CSS class painting a modifier, or null if it is not one of ours.
 *
 * @param {string} modifier
 * @returns {string|null}
 */
function colourClass (modifier) {
  return HEX_BY_MODIFIER.has(modifier) ? `${CLASS_PREFIX}${modifier}` : null
}

export { COLOURED_SPAN, TEXT_COLOURS, colourClass, colourHex, colourModifier }
```
