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

---

**Shaun Fitzsimons — 29 September 2026**

API guides now get the stepper, and the Traditional/Stepper toggle. Their Markdown goes through the same split as a local `content.md`, so pages come from the headings, one section per page.

- **No per-guide grouping yet.** `getStepperPages` is keyed by local id. The manifest would need an optional `stepperPages` field to group sections for an API guide.
- **Bookmarks are off for API guides.** The bookmark, `section/` and `position/` modules re-read content by local id, so heading bookmarks and "resume reading" are hidden for now.
- **A guide with no headings** still renders flat, as before.

---

**Shaun Fitzsimons — 5 October 2026**

A guide is its immutable Live versions plus at most one draft; "Awaiting review" is a locked state of that draft, never of a version.

- **Viewers see Live only.** A guide with no Live version is hidden from them. They reach older versions from the Versions list (`?version=N`, read-only, with a banner back to the current one).
- **Designers see every status** and get the review actions: Approve (the draft becomes the next Live version) and Request changes (it unlocks).
- **Delegated edit:** a viewer can "Request permission to edit"; a designer approves it. Session-long, not time-limited, and it doesn't make non-Live guides visible.
- **Prototype only:** older versions show the same mock content as the current one.

---

**Shaun Fitzsimons — 5 October 2026**

API guides now use a slug of their name as the URL (`/guide/peatland-and-moorland-rules`) instead of the API's uuid.

- **Playground only.** `data/playground-api-guides.js` maps the API's `id` to a slug and keeps the uuid as `apiId` for every call back to the API. Frozen snapshots still use the uuid.
- **Uniqueness:** a repeated name gets `-2`, `-3` and so on, in manifest order. A real slug field from the API would be more stable, since renaming a guide changes its URL.
- **Old uuid links** redirect to the hub.

---

**Shaun Fitzsimons — 5 October 2026**

Designers can now edit any guide, API guides included: they get Editor tools, can start a draft, send it for review and approve it as the next version.

- **API guides are read-only upstream**, so the draft is prototype-only state. The editor opens with the guide's name but the same sample content as any guide with no local content.
- **An approved API guide has no version switcher yet:** the API only serves its latest content.

---

**Shaun Fitzsimmons — 5 October 2026**

Editor tools is now one status card ("Version N is live", "You have unpublished edits") with the next action under it.

- With no branching there is only ever one draft, so the Draft tag and "based on Version N" are gone.
- "Changes requested" only shows once a reviewer has asked for some, instead of "None".
- Publishing checks stays always visible below the card.

---

**Shaun Fitzsimmons — 5 October 2026**

Publishing checks now sit in their own panel under the status card, with a "Last run" date and time.

- The last run is remembered in the browser (localStorage) per page, since checks are simulated; the same line shows on the document page.

---

**Shaun Fitzsimmons — 5 October 2026**

Running checks in Editor tools now always returns mock failures (8), so "View issues" has something to show; the in-panel example list is removed.

---

**Tim Gordon — 12 October 2026**

Added keyword search in the guide, brought over from the proof of concept's guide page, so a reader can find words in a long guide in either format.

- Ctrl+F (Cmd+F) goes to a sticky "Search for keywords in this document" box rather than the browser's find; Enter goes to the next match, Shift+Enter to the one before
- Matches, and the contents entries holding them, are highlighted in GOV.UK focus yellow; the current match is underlined, and its section or part is bold in the contents while it's in sight
- In the stepper a match on another page shows that page, the way the browser's find already did
- Matches are painted with the CSS Custom Highlight API so the TipTap viewer's content is never changed; a browser without it gets the counts and moves but no highlight
- Open: the search isn't kept across Previous/Next or a format switch

---

**Tim Gordon — 12 October 2026**

Keyword search matches whole words and whole phrases, and a page opened with `?keywords=` (from a Search hub result) searches at once. The format is now one choice for every guide.

- One word matches as a whole word ("pay" no longer matches "payment"); several match as the whole phrase, across bold and links but not from one paragraph into the next
- Opened with a search, the page starts at the first match in the part it opened at, keeps it in view while images load, and keeps the box focused so Enter goes on
- Stepper or traditional is kept in a cookie for a year, for every guide, not per guide in the session: a reader who prefers one format shouldn't have to choose it on each guide

---

**Tim Gordon — 21 October 2026**

A sharing link in the guide's left margin, for any place in the guide, not only its headings.

- A link icon follows the pointer: centred in the margin, level with the first line of the paragraph, list item, heading, table row or image under it, and still following while the pointer is in the margin, so it can be reached.
- On hover it becomes a button, like the heading's bookmark, with the tooltip "Click to copy sharing link". A click copies the link and the tooltip changes to "Copied to clipboard". No separate step to create the link first: it added a click for nothing.
- The link goes through guide/section/ (so it lands on the right stepper page) with a URL text fragment for the block's text, which the browser highlights.
- Open question: it is pointer-only. Keyboard and touch users have no way to reach it yet.

A guide information panel, opened from an info button beside the title.

- On hover the icon looks like a button, with the tooltip "Show guide information". A click opens a grey panel under the title, and the button stays pressed in until it is clicked again.
- The panel names each field, in the order of the upload journey's check answers page in the hub ("The guide's details", then "Owner and purpose"): last modified date, scheme, owner email, purpose of guidance, required knowledge and training, systems, and who the guidance is for. The title and version number are left out, since both are just above. The guide's description is left out too: it isn't part of production's metadata.
- Who it's for and its systems now come from the same data as the hub's filters, so the guide page and the hub agree.
- The panel starts closed in the page itself, not closed by script once the page has loaded, so it no longer shows and then vanishes. Without JavaScript the button does nothing.

---

**Tim Gordon — 23 October 2026**

Keyword search now matches anywhere in the text, in any case, as Word's Find does.

- "pay" finds "payment" and "repay" as well as "pay": readers write and read these guides in Word, so its Find is the search they know
- Several words still match as that phrase, across bold and links but not from one paragraph into the next
- The Search hub's search of every guide uses the same rule, so a result still opens on the matches it counted

Guides now open in the traditional format, the whole guide on one page, unless the reader has chosen the stepper.

- User research asked for this: "We need to default to traditional view"
- A reader's choice is still kept in a cookie for a year, for every guide, so a reader who prefers the stepper keeps it

While a search has matches, the contents take you to them.

- Selecting a section or heading in the contents goes to its first match, as Next does, and the search box shows which ("Match 4 of 12"); Next and Previous carry on from there
- A section's match count is a link too, and does the same
- A section with no match, or a Ctrl-, Shift- or middle-click, still opens the section as before
