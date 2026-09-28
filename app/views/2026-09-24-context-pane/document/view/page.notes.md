---
status: draft
---

**Shaun Fitzsimons — 24 September 2026**

Fixed, per user feedback: this page's breadcrumb only ever went Home > documentTitle, same as the archived v6 version it was ported from (`app/views/archive/v6/guidance-document-choice`) — nothing on it, or on either viewer it leads to, linked back to the document overview page, only to the hub. Added a third crumb: the document title now links to `/playground/document/:id`, with this page's own name as the final, unlinked crumb.

Also added the context pane (on the left, matching every other pane page — see `hub/page.notes.md`) and `bodyClasses = "app-full-width"`, for continuity with the document overview page either side of this one in the "View" journey.

---

**Shaun Fitzsimons — 24 September 2026**

Row is now `.app-context-pane-row` (flex), matching `document/page.njk` — see `hub/page.notes.md` for why (collapsing the pane has to work without JavaScript and give its width back to the form's own column, not leave it blank).
