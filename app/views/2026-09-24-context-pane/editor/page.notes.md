---
status: draft
---

**Shaun Fitzsimons — 24 September 2026**

Navigation redesign (see `hub/page.notes.md`): added the context pane as a full-width row below the Content/editor/Changes columns, collapsed by default (`defaultCollapsed`), rather than as a fourth column alongside them. This page's own three columns are already tight, and its floating-comment position tracking (`computeFloatingPositions()`) depends on the editor box's own width — a fourth column would change that width and risk breaking it for no clear benefit, since the pane's designer content (Needs your attention, Linked from) is useful here but not something that needs to sit in the eyeline while actively editing.

---

**Shaun Fitzsimons — 24 September 2026**

Collapsing moved server-side — `defaultCollapsed: true` is now passed to `buildContextPane` (controller.js), which resolves it against the session flag the Hide/Show forms write to (see `app/data/context-pane.js`'s `getPaneCollapsed`), rather than a template-only `{% set defaultCollapsed = true %}` driving a client-side toggle. No sibling column to hand width back to here (this pane was never sharing a row with anything), so nothing else about this page's layout changes — same reasoning as before, just a real `<form>` round-trip instead of a script. See `hub/page.notes.md`.
