---
status: draft
---

**Shaun Fitzsimons — 28 September 2026**

Added context pane as right-hand quarter column; set `app-full-width` layout; reading column narrows from three-quarters to one-half.

- Fixed routing bug: `:id` baked into `setupRouter` mount path; moved to router's own path

---

**Shaun Fitzsimons — 28 September 2026**

Two feedback fixes:

- Pane moved to leftmost column for consistency across all pane pages
- Removed breadcrumb: duplicated Back link and only pointed at hub

---

**Shaun Fitzsimons — 28 September 2026**

Changed to `.app-context-pane-row` flex layout so title and text collapse with pane without JS.

---

**Shaun Fitzsimons — 28 September 2026**

Context pane replaced by side nav. Contents list (was pane's Contents section) restored in-page above text. Added "Pin guide" and "Bookmark to a case" buttons below title (moved from side nav for accessibility). Reading column two-thirds again.

---

**Shaun Fitzsimons — 28 September 2026**

Superseded by merged guide page's traditional format (`../../../guide/`). Controller redirects to `/playground/guide/:id?format=traditional` to preserve old links.
