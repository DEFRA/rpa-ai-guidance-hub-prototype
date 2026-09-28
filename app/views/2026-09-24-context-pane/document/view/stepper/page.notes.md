---
status: draft
---

**Shaun Fitzsimons — 24 September 2026**

Navigation redesign (see `hub/page.notes.md`): added the context pane as a new right-hand quarter column, and set `bodyClasses = "app-full-width"`.

The "Hide content" toggle (collapses the left contents nav to widen the reading column) already existed — its own script used to swap the text column between `govuk-grid-column-three-quarters` and `-full`. With the pane's own fixed quarter now always present, that swap is rebased one notch: `-one-half` (contents visible) ↔ `-three-quarters` (contents hidden), so the text column never claims the pane's width.

Also fixed `routes.js`: same pre-existing bug as `../traditional/routes.js` (`:id` baked into `setupRouter`'s mount path, never reaching `req.params`) — this viewer was always showing the first `guidanceDocuments` entry regardless of the id in the URL. Fixed the same way.

---

**Shaun Fitzsimons — 24 September 2026**

Two more fixes, per user feedback:

- The context pane now sits leftmost (pane, contents, text — the toggle's `-one-half`/`-three-quarters` swap on the text column is unaffected, since it only changes classes, not column order).
- Removed the "Home > documentTitle" breadcrumb (outside the Preview flow) — same reasoning as `../traditional/page.notes.md`: it duplicated the Back link `controller.js` already sets to the document overview page, and only pointed at the hub.

---

**Shaun Fitzsimons — 24 September 2026**

The pane's own sections are now a real `govukAccordion` rather than an always-open list — see `hub/page.notes.md`. `../traditional/page.njk` folded its own contents list into the pane as a "Contents" section and dropped to two columns; this page keeps its own separate Content/Case notes sidebar column exactly as it was, deliberately not folded in the same way — that sidebar is a stateful tool (a real search over this document's own text, an editable Case notes tab), not passive context like a plain anchor list, and collapsing it into the pane risked breaking working functionality for no clear benefit. Worth revisiting if research says the two viewers should match here.

---

**Shaun Fitzsimons — 24 September 2026**

Two more rounds of feedback, both landing differently here than on the other pane pages:

- **Collapsing without JavaScript.** The other pane pages moved to a flex row (`.app-context-pane-row`) so a collapsed pane's width goes straight to a `flex: 1 1 auto` main column with no script involved. This page stays on the standard grid (see above), so instead `data-document-text-column`'s own class is chosen server-side from `contextPane.collapsed` (`three-quarters` instead of `one-half`) when the pane's column isn't rendered at all — same outcome, explicit classes instead of flex. The existing "Hide content" toggle's own script now reads whether the pane is present once (`document.querySelector('.app-context-pane')`, fixed for the page's lifetime, since reopening the pane is a real page reload) and folds that into its own one-half/three-quarters/full choice, rather than only ever knowing about its own two states.
- **Drag-to-resize.** The other pane pages' `.app-context-pane-row__pane` picked up a native CSS `resize: horizontal` handle. Not added here — that column is still a percentage-width `govuk-grid-column-one-quarter`, and dragging it to a fixed pixel width wouldn't shrink its grid siblings (no flex to redistribute into), so it would just overlap or wrap them. Would need the same flex conversion as the other pages to add safely.
