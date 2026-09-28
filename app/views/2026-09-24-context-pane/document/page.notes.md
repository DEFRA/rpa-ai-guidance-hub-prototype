---
status: draft
---

**Shaun Fitzsimons — 24 September 2026**

Navigation redesign (see `hub/page.notes.md` for the full brief): added the context pane in a new right-hand quarter column, and set `bodyClasses = "app-full-width"` so a one-quarter/one-half/one-quarter row isn't cramped at 960px.

The pane's own "This document" section (status/scheme/version-awareness) inevitably overlaps a little with the version summary list already on this page (Version/Version notes/Last updated/Published) — kept both rather than removing the summary list's own interactive version switcher, which the pane doesn't attempt to replace. Left as a known, minor duplication rather than a blocker; worth revisiting once research shows whether it reads as redundant.

While testing the pane against a real id, found (and fixed) a pre-existing routing bug this page's own "Edit" button (Published branch) was hitting: `document/start-editing/routes.js` baked `:id` into `setupRouter`'s own mount path rather than the router's path, which the kit's `express.Router()` (no `mergeParams`) never populates — so `req.params.id` was always `undefined` and "Edit" silently opened the editor with no document at all. Same bug, same fix, in `document/view/routes.js` and both viewers' own `routes.js` — see those pages' own notes.

---

**Shaun Fitzsimons — 24 September 2026**

The pane moved to the leftmost column, per user feedback (now leftmost on every pane page — see `hub/page.notes.md`).

---

**Shaun Fitzsimons — 24 September 2026**

The row is now `.app-context-pane-row` (a flex row), not a plain `govuk-grid-row`, and the pane's own column only renders when `not contextPane.collapsed` — collapsing now has to work with JavaScript off and hand its width straight to the main column, not leave it blank. Full detail, including the drag-to-resize handle this also picked up, in `hub/page.notes.md`.
