---
status: draft
---

**Shaun Fitzsimons — 28 September 2026**

Added context pane as right-hand quarter column; set `app-full-width` layout for wider row.

- Pane's "This document" overlaps version summary list slightly; kept both for interactive version switcher
- Fixed pre-existing routing bug in "Edit" button: `:id` baked into `setupRouter` mount path instead of router's path (same bug in document/view and both viewers)

---

**Shaun Fitzsimons — 28 September 2026**

Pane moved to leftmost column per feedback.

---

**Shaun Fitzsimons — 28 September 2026**

Changed to `.app-context-pane-row` flex layout; pane column not rendered when collapsed so space reclaims to main content without JS.

---

**Shaun Fitzsimons — 28 September 2026**

Context pane replaced by side navigation. Added "Pin guide" button under title; pinning needed a home on page where reader decides guide matters.

---

**Shaun Fitzsimons — 28 September 2026**

Added "Bookmark to a case" form (Case ID/SBI, with listing and removal of existing bookmarks); moved from side nav for accessibility.

---

**Shaun Fitzsimons — 28 September 2026**

Superseded by merged guide page (`../guide/`); version switcher and case bookmark folded into guide page. Controller redirects to `/playground/guide/:id` to preserve old links.
