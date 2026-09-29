---
status: draft
url: /guide/:id
---

**Shaun Fitzsimons — 28 September 2026**

Consolidated four-click journey (document overview → format choice → viewer) into a single guide page with toggled direction.

- Merges version switcher, case bookmark, metadata and format choice into one page
- Three directions (side panel/toolbar/inline) share one controller, switchable with `?direction=` parameter for comparison
- Editor controls reuse document overview's status/versions/publishing-checks logic
- Open: Does format toggle suit every reader, or only later in the guide?
- Prototype-only: the direction switcher, format toggle, role switch, and simulated publishing checks; real production fixes guide to one format per upload
- Old routes redirect here to preserve research links/bookmarks

---

**Shaun Fitzsimons — 28 September 2026**

Settled on side-panel direction; toolbar and inline removed. Panel mirrors the side nav: light grey, collapsible to icon rail via POST form.

- Reuses side-nav styling tokens to avoid duplication
- Stacks below reading column below 769px
- Deliberately omitted: drag-to-resize, drawer on narrow screens, Ctrl/K shortcut

---

**Shaun Fitzsimons — 28 September 2026**

Two fixes from design crit:

- Full height: panel now a shell column (`layouts/main.html`'s `shellAside`), lines up top/bottom with nav, stacks below reading column when no shell
- Bookmark journey: moved to own question page (`guide/bookmark/`) with GOV.UK radios-with-conditional-reveal pattern and success notification on return

---

**Shaun Fitzsimons — 28 September 2026**

Added drag-to-resize with direction option; width saved per session via CSS custom property so narrow-screen stacking still works.

- Reuses `setupResize()` logic from side-nav with opposite direction
- Rail expanded with expand button and bookmark shortcut
- Still omitted: narrow-screen drawer, Ctrl/K shortcut

---

**Shaun Fitzsimons — 28 September 2026**

Fixed contents list indentation to show section/part hierarchy (was flush due to missing padding-left).

---

**Shaun Fitzsimons — 28 September 2026**

Added conditional branching to stepper; branch options render inline as links to named parts, separate from Previous/Next pagination.

- Branch body entries (`{ type: "branch", question, options }`) render where they fall in the part, not at bottom
- Stepper uses `?step=` URLs; traditional uses in-page anchors
- Only converts branches where destination is genuinely out of order in source guidance
- Options with no destination stay plain text to avoid misrepresenting guide content

---

**Shaun Fitzsimons — 28 September 2026**

Reworked traditional format with Word-style heading scale and format-specific content links.

- Removed section header eyebrow; first part of section is h1, rest are h2, only rule between sections
- Fixed flat-steps single-part sections now rendering their own heading
- Reordered format toggle to Traditional-then-Stepper
- Fixed contents list to use format-specific hrefs (stepper uses `?step=`, traditional uses in-page anchors)

---

**Shaun Fitzsimons — 28 September 2026**

A guide with a converted `content.md` (`app/data/guides/<id>/`, laid out like the API's document store) now renders through TipTap with the real guidance editor's schema, copied from `rpa-ai-guidance-hub-ui` at `6b7f2ba`. That way research shows what the production viewer will show, including tables with lists in cells and `[text]{.red}` colour spans.

- The Markdown is split at its two shallowest heading levels into sections/parts (`app/data/guide-markdown.js`), so the stepper, contents list and pagination work unchanged. Every other guide still renders from its structured JS content.
- The only sample so far is `sfi-nutrient-management-actions`, the upload journey's `CONVERTED_GUIDE_ID`, with made-up content.
- A section's lead-in text becomes its own part, headed with the section's name, so "1 Overview" appears twice in the contents list. Open question: fold the lead-in into the section heading instead?
- To re-sync with the UI repo or rebuild the bundle, see `scripts/tiptap-viewer/README.md`.

---

**Shaun Fitzsimons — 28 September 2026**

Reworked for 200-page Word guides, after v6 traditional-viewer feedback that finding things (mostly), losing your place and length made life harder.

- **Stepper steps through pages, not parts.** A page is a group of whole top-level sections, set per guide in `guide-metadata.js`'s `STEPPER_PAGES_BY_ID` (one section per page by default, `guide-content.js`'s `groupPages`). One part per step meant hundreds of Previous/Next clicks on a long guide. `?step=N` links from before still resolve to the page holding that part.
- **Traditional stays one continuous page**, with two fixes: a section's name always shows in the body (every Markdown section now opens with a lead part, which also ends the "1 Overview" repeat in the contents list), and the contents list no longer shows a "current" part, since traditional has none.
- **Case bookmarks work per section.** A "Bookmark section" link under each section heading asks the same case/SBI question (`bookmark/?section=`). Bookmarked sections list under the case in this panel and the side nav, and link via `section/`, which lands on the right page in either format. Whole-guide bookmarking stays in the panel.
- **Resume reading.** `guide-position.js` keeps the URL `#hash` on the heading being read (so refresh, Back and copy-link keep your place) and saves it as the guide's position once the reader scrolls. A fresh visit offers "You were last reading … Continue reading", and the hub's Recently opened list links straight there. It's one position per guide, not an automatic bookmark, so the case bookmarks don't fill up with noise.

Open questions: should the resume point jump you there automatically rather than offer it? Is a small text link under each section heading discoverable enough for bookmarking?

---

**Shaun Fitzsimons — 28 September 2026**

The section bookmark is now the side nav's bookmark icon, inline with the section heading, replacing the text link underneath it. The icon is filled once the section is bookmarked to any case.

- It sits beside the `<h2>`, not inside it, so the heading text stays clean for screen readers and the contents list. Its name is visually hidden text; a tooltip (the side nav's own, Esc-dismissable) labels it for sighted users.
- "Bookmarked to Case …" stays as muted text under the heading, since a tooltip never shows on touch.

Later the same day: every heading can now be bookmarked, not just a section's.

---

**Shaun Fitzsimons — 28 September 2026**

Feedback: guides are easier to read in Word. We think that's because Word's page is centred and wider, where this viewer was left-aligned and narrow.

- **Centred page.** The reading column (`.app-guide-reading`) is now one centred "page" with a single width for everything on it. Before, each block capped itself at `42em` of its own font size, so headings, body and contents all ended at different points.
- **Wider by default.** Standard is 960px, up from roughly 800px of body text.
- **Reader-chosen width.** "Page width: Standard / Wide (1200px) / Full width" sits beside Pin guide (`partials/reading-width.njk`). It's a form POST (`reading-width/`), so it works without JavaScript, and it's remembered across guides as a reading preference. Presets rather than a drag handle: easier to hit, to use from a keyboard and to talk about in research.
- The contents list stays capped at 640px so it doesn't become a page-wide grey band.

Open question: is Full width actually used, or do long lines on a wide monitor push people back to Standard?

---

**Shaun Fitzsimons — 28 September 2026**

Ctrl+F in the stepper, after research criticised it only searching the current page. Every stepper page is now in the HTML, and the pages not being read are `hidden="until-found"`: hidden like `[hidden]`, but the browser's own find-in-page still searches them. On a match, the browser reveals that page, and `guide-pages.js` makes it a real page change: it re-hides the old page and moves `?page=` and the contents list's current mark.

- **Real Ctrl+F, not a custom search box.** People press it without thinking, and taking over the browser's find has accessibility problems. Works in Chromium (Edge on Defra laptops, Chrome) and I believe recent Firefox; not Safari yet. Where it isn't supported, the other pages act as plain `[hidden]` and find covers the current page, as before.
- **Revealed pages keep the server-rendered HTML** rather than mounting TipTap. Swapping the DOM under the browser's find highlight would lose the match and break "find next". So only the current page carries the Markdown for the viewer, which also keeps a 200-page guide from starting 200 editors. The server-rendered HTML (`app/lib/markdown-fallback.js`) now matches TipTap for colour spans, highlights and lists in table cells, so the two look the same.

Open question: on a 200-page guide the stepper's HTML is the whole guide. Check the page weight with a real converted document. Subheadings get the same icon, and the bookmark stores their `part-N` anchor, which the bookmark page, `section/`, the panel and the side nav already resolve. Headings nested inside a converted part's Markdown (`####` and deeper, rendered by TipTap) don't get one yet: they have no anchor of their own.
