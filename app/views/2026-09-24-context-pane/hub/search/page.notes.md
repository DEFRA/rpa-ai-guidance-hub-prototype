---
status: retired
---

**Shaun Fitzsimons — 24 September 2026**

Rewritten as a full port of the retired `/v6/manage-guidance/search-guidance` page, replacing the plain title-match table this page shipped with at consolidation time.

- `overviewHref` is rebuilt as `/playground/document/:id`, not the `?id=` style v6 used, to match playground's own document route.
- No breadcrumb — kept playground's existing `backHref` "Back" link instead.
- State tag still reads "Awaiting review" (the data's own value), not "Awaiting approval" (the hub tab's label) — open question whether to relabel for consistency.

---

**Shaun Fitzsimons — 24 September 2026**

Retired as its own page — the navigation redesign folds the hub's four tabs into a persistent context pane (see `app/data/context-pane.js` and `hub/page.notes.md`) and, per the same brief, turns the hub itself into this page's all-guidance list, filters and all. `routes.js` now just redirects `/playground/hub/search` (keeping `?q=`) to `/playground/hub`, so old links/bookmarks still land somewhere useful. `controller.js`/`page.njk` are gone; the filters/results markup and script live in `hub/page.njk` now.
