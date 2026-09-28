---
status: draft
---

**Shaun Fitzsimons — 24 September 2026**

Navigation redesign (see `hub/page.notes.md`): added the context pane as a new right-hand quarter column, and set `bodyClasses = "app-full-width"`. The contents column stays a quarter and the reading column narrows from three-quarters to one-half to make room — no interactive width-toggle here to complicate (unlike the stepper), so this was a straight column-class change.

Also fixed `routes.js`: it built `setupRouter('/playground/document/:id/view/traditional')` with `:id` in the mount path, which the kit's router never populates into `req.params` — this page was silently always showing the first `guidanceDocuments` entry regardless of which id was in the URL. Fixed by moving `:id` into the router's own registered path instead (`/playground/document` + `router.get('/:id/view/traditional', ...)`) — same fix as `../routes.js` and `../stepper/routes.js`.

---

**Shaun Fitzsimons — 24 September 2026**

Two more fixes, per user feedback:

- The context pane now sits in the leftmost column (pane, contents, text), not the rightmost — consistent across every pane page from here on.
- Removed the "Home > documentTitle" breadcrumb entirely. It duplicated the Back link `controller.js` already sets (to the document overview page) and, worse, only pointed at the hub — one of the two "picker/viewers don't link anywhere useful" complaints. The Back link was already correct; the breadcrumb was the actual bug.

---

**Shaun Fitzsimons — 24 September 2026**

The whole page (title and text both, not just the reading column) now sits inside `.app-context-pane-row`, a flex row — collapsing the pane has to work without JavaScript and hand its width to the text column, not leave it blank, which a flex row does for free and the standard grid's fixed fractions can't. See `hub/page.notes.md`.
