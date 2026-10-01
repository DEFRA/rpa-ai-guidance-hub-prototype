---
status: draft
---

**Shaun Fitzsimons — 28 September 2026**

Added context pane as right-hand quarter column; set `app-full-width` layout.

- Rebased "Hide content" toggle to swap text column between `-one-half` and `-three-quarters` to account for pane width
- Fixed routing bug: `:id` baked into `setupRouter` mount path; moved to router's own path

---

**Shaun Fitzsimons — 28 September 2026**

Two feedback fixes:

- Pane moved to leftmost column; toggle unaffected since it only changes classes, not order
- Removed breadcrumb (outside Preview): duplicated Back link and only pointed at hub

---

**Shaun Fitzsimons — 28 September 2026**

Pane sections converted to `govukAccordion`; Content/Case notes sidebar kept separate (not folded into pane).

- Sidebar is stateful tool (text search, editable notes), not passive context; folding risked breaking functionality

---

**Shaun Fitzsimons — 28 September 2026**

Collapsing and resize handle handled differently here (grid, not flex):

- Pane collapse: text column class chosen server-side from `contextPane.collapsed` instead of flex reclaim; "Hide content" toggle reads whether pane present once and adjusts own states
- Resize: not added due to grid column constraints (would overlap/wrap, needs flex conversion)

---

**Shaun Fitzsimons — 28 September 2026**

Context pane replaced by side nav; text column three-quarters again, "Hide content" toggle only accounts for sidebar. Added "Pin guide" and "Bookmark to a case" buttons below title (moved from side nav for accessibility).

---

**Shaun Fitzsimons — 28 September 2026**

Superseded by merged guide page's stepper format (`../../../guide/`); visual redesign (section/part hierarchy, capped measure, pagination) lives there. Controller redirects to `/playground/guide/:id?format=stepper` to preserve old links.
