# Guide viewer plans

Implementation plans for the guide viewer work prototyped in `app/views/playground/guide/` (28–29 September 2026), written so another agent can rebuild each feature from scratch, in this prototype or in the real service (`rpa-ai-guidance-hub-ui`). Each plan gives the context (the research feedback behind it), the resulting file structure, every file in detail with the prototype's final code, the gotchas found while building it, and how to verify it.

Build them in this order. Each depends on the ones before it.

| # | Plan | What it adds | Depends on |
| --- | --- | --- | --- |
| 1 | [TipTap Markdown viewer](01-tiptap-markdown-viewer.md) | Converted `content.md` guides rendered through the production TipTap schema, split into sections/parts by heading, with a matching server-rendered fallback | — |
| 2 | [Stepper pages and traditional fixes](02-stepper-pages.md) | The stepper steps through pages (groups of whole sections, set in guide metadata) instead of single parts; traditional always shows section names | 1 |
| 3 | [Heading-level case bookmarks](03-heading-bookmarks.md) | A bookmark icon on every heading; case/SBI bookmarks point at a specific section or subheading; one stable `section/` link that lands on the right page | 2 |
| 4 | [Resume reading](04-resume-reading.md) | The URL `#hash` follows the heading being read; the last position is saved and offered back ("Continue reading"), including from the hub's Recently opened | 2, 3 (`section/` route) |
| 5 | [Centred, resizable reading page](05-reading-page-width.md) | One centred "page" like Word's, wider by default, with Standard / Wide / Full width presets | — (touches the same templates) |
| 6 | [Ctrl+F across stepper pages](06-stepper-find-in-page.md) | Every stepper page is rendered, the others `hidden="until-found"`, so the browser's own find searches the whole guide and switches page on a match | 1, 2, 4 |

## Overall to do

Tick a plan off only when every item in its own **To do** list is done and its Verification passes.

- [ ] **Plan 1: TipTap Markdown viewer.** Bundle built and committed, sample guide renders in both formats, no-JS fallback matches.
- [ ] **Plan 2: Stepper pages.** Grouped pages from metadata, old `?step=` links resolve, traditional shows every section name.
- [ ] **Plan 3: Heading bookmarks.** Icon on every heading, section/subheading bookmarks in the panel and side nav, `section/` redirect.
- [ ] **Plan 4: Resume reading.** Hash follows scrolling, Continue inset, Recently opened deep links.
- [ ] **Plan 5: Page width.** Centred page, Standard / Wide / Full width saved across guides.
- [ ] **Plan 6: Ctrl+F in the stepper.** Every page rendered, find reveals and switches page, checked by hand in each browser.
- [ ] **Wrap-up.** `npm run format:check` passes, every touched page has a dated notes entry, and a snapshot is taken (`npm run snapshot`) before the next research session.

## Why these exist (research feedback, in one place)

- Source guides are **Word documents of up to 200 pages**. One-part-per-step stepping and one endless scroll both break down at that size.
- v6's traditional viewer "would make life harder", mostly because it was **hard to find things**, and because people **lost their place** and found it **too long**.
- Guides felt **easier to read in Word**. Likely cause: Word's page is centred and wider, and this viewer was left-aligned and narrow.
- The stepper was criticised for the **lack of Ctrl+F**, since it only ever showed one page.

## Conventions every plan follows (from this repo's CLAUDE.md)

- Every page is a module under `app/views/playground/<page>/` with `routes.js` → `controller.js` (glue only) → `view-model.js` (all shaping and href-building) → `page.njk`. New endpoints get their own folder, never a handler in `legacy/routes.js`.
- Session-backed data shared across pages goes in `app/data/`.
- Non-mechanical changes get a dated `**Author — date**` entry in the page's `page.notes.md`.
- Everything works without JavaScript first; scripts are progressive enhancement.
- WCAG 2.2 AA. Non-GDS patterns are fine if accessible and on the Defra palette.
- Run `npm run format` before committing. The TipTap files copied from upstream and the built bundle are in `.prettierignore` so they stay byte-identical.
- The Dockerfile only copies `app/` (plus package files), so **nothing under `scripts/` is available at runtime**.

## Known open questions (for research, not implementation)

- Should resume jump straight to the saved position rather than offer it?
- Is Full width actually used, or do long lines push people back to Standard?
- Page weight of a real 200-page guide in the stepper, now that every page is in the HTML.
- A section's lead-in text shows under the section heading. Should a section with no lead-in skip straight to its first subheading?
