---
status: draft
url: /hub
---

**Shaun Fitzsimons — 24 September 2026**

Navigation redesign, per brief: participants in the first round found the prototype hard to use because it walks an expert user through a GDS wizard built for a novice. Fix, this round:

- The hub's four tabs (Recently opened, Saved guidance, Editing, Awaiting approval) move into a persistent context pane (`app/views/partials/context-pane.njk`, `app/data/context-pane.js`), shown on the hub, the document overview page, both guidance viewers and the editor — same structure for both roles, content varies by role (status/scheme/version-awareness for the document in view, related/referenced/linked-from documents, and the personal lists above, plus a search-position readout and recent searches).
- The hub itself becomes the all-guidance list: what was the separate `/playground/hub/search` page (filters, sort, results) now renders straight onto the hub — see that page's own retirement note. Search, even with an empty box, just re-filters this same list; there's nowhere else to redirect to.
- A role (viewer/designer), chosen at sign-in and switchable from the pane, decides which of the pane's content a session sees.
- This page (plus document/viewer/editor) sets `bodyClasses = "app-full-width"` — a filters/results/pane row is cramped at the standard 960px width. See `_app-full-width.scss`.

Open question: the pane's "View all" links on Editing/Awaiting approval/etc. all point at the plain hub — they don't carry the state filter across, since the hub's own filters are client-side only (no `?state=` query wiring). Worth revisiting if research shows people expect that link to arrive pre-filtered.

---

**Shaun Fitzsimons — 24 September 2026**

Two rounds of feedback:

- The pane moved to the leftmost column on every page that has one (hub, document overview, the "View" picker, both viewers) — it was rightmost. No change on the editor: its pane is a full-width row below the existing columns, not a left/right column, for reasons its own notes give.
- Fixed the document "View" journey's own navigation, using the archived v6 version (`app/views/archive/v6/find-guidance`) as the reference for where the missing link should go: the picker page (`document/view/`) only ever breadcrumbed Home > documentTitle, and both viewers carried the same breadcrumb — neither linked back to the document overview page, only to the hub. The picker's breadcrumb now runs Home > documentTitle (→ overview) > current page; both viewers already had a correct Back link to the overview page (`controller.js`'s own `backHref`) that a redundant, hub-only breadcrumb was sitting alongside — removed the breadcrumb, kept the Back link. See `document/view/page.notes.md` and both viewers' own notes.

---

**Shaun Fitzsimons — 24 September 2026**

Reworked the pane itself, per user feedback that a page with several sections showing all at once (a document's own facts, its relationships, the reader's lists) crowded out whichever one actually mattered there:

- Every section is now one `govukAccordion` item instead of an always-open block, with exactly one expanded on load — "the main info for that page" (`app/data/context-pane.js` decides which: a viewer's Contents when there is one, else This document, else Your lists). `rememberExpanded: false` — the accordion's own session-storage memory is keyed by one shared id across every page using this partial, so remembering would leak one page's open section onto an unrelated one.
- The traditional viewer's own contents list folded into the pane as a "Contents" section, dropping that page to two columns (pane, text) instead of three — it was always a plain anchor list, so nothing was lost. The stepper viewer keeps its own separate Content/Case notes sidebar column; see its own notes for why that one didn't fold in the same way.
- **Within "Your lists" too**: a further round of feedback asked for each individual list (Recently opened, Saved guidance, Editing, Awaiting approval, Needs your attention) to be its own collapsible item, not grouped under one shared "Your lists" panel — `buildYourListsSections` (was `buildYourListsSection`) now returns one section per list, each with its own item count in its accordion heading.
- The search-position readout and recent searches stay outside the accordion (always visible, not one more thing to expand) — they're transient/persistent context, not a section of it.

---

**Shaun Fitzsimons — 24 September 2026**

Collapsing the pane, redone properly, per user feedback that it needs to work with JavaScript off, and that the space it frees should go to whatever's next to it, not sit blank:

- **Collapsed state moved server-side.** `contextPaneCollapsed` is now a session flag (`getPaneCollapsed`/`setPaneCollapsed`, `app/data/context-pane.js`), not client-side (localStorage) — `context-pane.js` (the client script) is gone entirely. Hide/Show are real `<form method="post" action="/playground/context-pane-toggle">`s (see that route), the same round-trip pattern `switch-role` already uses: the server already knows which way to render before the page loads, so there's no script needed to flip anything after the fact.
- **The pane's own column simply isn't rendered when collapsed** (the page's own `{% if not contextPane.collapsed %}`, not `[hidden]` set by a script) — every page's main content sits in a `flex: 1 1 auto` column (`.app-context-pane-row`/`__pane`/`__main`, replacing the plain `govuk-grid-row` these pages used a moment ago) that reclaims the freed width for free, the same departure from the standard grid `_app-v3.scss`'s own `.app-v3-search`/`.app-guide-view__layout` already make, for the same reason. The stepper viewer, which keeps its own two-column split on the standard grid, chooses its column classes from `contextPane.collapsed` directly instead — see its own notes.
- **A small "Show context" form** (`partials/context-pane-trigger.njk`) takes the pane's place when it's collapsed, since the Hide button inside the pane disappears along with everything else in it.
- **Drag-to-resize**, also per feedback: `.app-context-pane-row__pane` now has `resize: horizontal` — the native browser handle, not a JS-built one, so it works without JavaScript same as everything else here. Not remembered across reloads, flagged in `_app-context-pane.scss`'s own comment as a gap a real resizable-panel pattern would need to close.

---

**Shaun Fitzsimons — 24 September 2026**

Two fixes to the resize handle, per user feedback that it didn't work and that a corner grip wasn't what was wanted:

- **The bug**: `.app-context-pane-row__pane` was `flex: 0 0 300px` — a fixed `flex-basis`, which wins over `width` in a flex item's sizing, so dragging the native handle changed `width` but the rendered size never moved. Fixed by giving it `flex: 0 0 auto` plus a plain `width: 300px` instead, so the flex-basis resolves from that width and dragging it actually takes effect.
- **The border handle**: added `partials/context-pane-resize-handle.njk` + `context-pane-resize.js` — a full-height handle along the pane's right-hand border (not just a corner), with Left/Right arrow key support the native handle never had. This is a JS enhancement, `[hidden]` until the script actually attaches; the native corner grip stays underneath as the no-JS fallback (still fixed, so still genuinely usable without JavaScript), rather than dropping that guarantee for a nicer drag target.
- Not included on the stepper viewer, same reason its own notes already give for not getting the flex treatment at all: its pane column is still a percentage-width grid column, and dragging it to a fixed pixel width would just overlap its siblings rather than resize alongside them.

---

**Shaun Fitzsimons — 24 September 2026**

Filters: vertical one-third sidebar → horizontal MoJ-style row, off `<select>` per GDS guidance, and off client-side-only filtering:

- Hand-ported (not installed) the MoJ Design System Filter component's structural shell — header / selected-filters-with-removable-tags / options — under this repo's own `.app-filter*` BEM, since MoJ's own docs only cover a vertical layout and their CSS/icons weren't wanted verbatim.
- Every field in `.app-filter__options` is always visible and in-flow — no per-facet collapse, disclosure or popover. A first pass tried a `<details>`-per-facet dropdown; dropped per feedback that GDS doesn't sanction modal-style dropdown panels.
- Category, Scheme and Year all expect many options in the real service, so all three are plain `<select>`s progressively enhanced with `accessible-autocomplete` (`enhanceSelectElement`, `cssNamespace: 'app-autocomplete'`, hand-styled rather than the vendor CSS) — the underlying `<select>` stays the source of truth. State stays checkboxes (a fixed three-value enum, not a long list). Version is dropped as a filter entirely (the Version tag on each result card is unrelated and stays). Sort-by stays a plain `<select>` — explicitly out of scope, and a widely-accepted convention distinct from a filter select.
- **Filtering moved server-side, off the old client-side-only approach**: found mid-build that the client-side version (matching MoJ's own real-link tag removal was deliberately skipped for it at first) meant the whole filter row did nothing at all with JavaScript off, same gap the search box had before it became a real GET form. `view-model.js` now reads `category`/`scheme`/`year`/`state`/`sort`/`q` straight off `req.query` and filters/sorts `buildManageGuidanceSearchResults()`'s results itself — `#hub-filters` (Category/Scheme/Year/State, plus a hidden `q` mirroring the current search) is one real `<form>`; Sort by sits outside it in the results header but submits with it via `form="hub-filters"`. Selected-filter tags and Clear filters are now plain `<a href>`s (`selectedFilters`/`buildHref()` in view-model.js), matching MoJ's own real-link removal after all. pageScripts is now pure progressive enhancement (the autocomplete, plus an optional auto-submit on Sort by change) — nothing left depends on JS to function. This is also most of the way to closing the pane's "View all" gap noted in the first entry above (the mechanism to carry `?state=` now exists), though the pane's own links aren't updated to use it yet.
- `_app-organic-search.scss`'s old `.app-filter-group*`/`.app-organic-search__filters` rules are left in place, unused by this page now but still rendering the frozen `2026-09-26-test-round` snapshot and several archived v2/v5/v6 pages — new styling lives in `_app-filter.scss` instead.
