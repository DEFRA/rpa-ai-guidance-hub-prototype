---
status: draft
url: /guide/:id
---

**Shaun Fitzsimons — 28 September 2026**

Consolidated four-click journey (document overview → format choice → viewer) into a single guide page with toggled direction.

- Merges version switcher, case bookmark, metadata and format choice into one page
- Three directions (side panel/toolbar/inline) share one controller, switchable with `?direction=` parameter for comparison
- Editor controls reuse document overview's status/versions/publishing-checks logic
- Open: Does format toggle suit every reader, or only later in the guide?
- Prototype-only: the direction switcher, format toggle, role switch, and simulated publishing checks; real production fixes guide to one format per upload
- Old routes redirect here to preserve research links/bookmarks

---

**Shaun Fitzsimons — 28 September 2026**

Settled on side-panel direction; toolbar and inline removed. Panel mirrors the side nav: light grey, collapsible to icon rail via POST form.

- Reuses side-nav styling tokens to avoid duplication
- Stacks below reading column below 769px
- Deliberately omitted: drag-to-resize, drawer on narrow screens, Ctrl/K shortcut

---

**Shaun Fitzsimons — 28 September 2026**

Two fixes from design crit:

- Full height: panel now a shell column (`layouts/main.html`'s `shellAside`), lines up top/bottom with nav, stacks below reading column when no shell
- Bookmark journey: moved to own question page (`guide/bookmark/`) with GOV.UK radios-with-conditional-reveal pattern and success notification on return

---

**Shaun Fitzsimons — 28 September 2026**

Added drag-to-resize with direction option; width saved per session via CSS custom property so narrow-screen stacking still works.

- Reuses `setupResize()` logic from side-nav with opposite direction
- Rail expanded with expand button and bookmark shortcut
- Still omitted: narrow-screen drawer, Ctrl/K shortcut

---

**Shaun Fitzsimons — 28 September 2026**

Fixed contents list indentation to show section/part hierarchy (was flush due to missing padding-left).

---

**Shaun Fitzsimons — 28 September 2026**

Added conditional branching to stepper; branch options render inline as links to named parts, separate from Previous/Next pagination.

- Branch body entries (`{ type: "branch", question, options }`) render where they fall in the part, not at bottom
- Stepper uses `?step=` URLs; traditional uses in-page anchors
- Only converts branches where destination is genuinely out of order in source guidance
- Options with no destination stay plain text to avoid misrepresenting guide content

---

**Shaun Fitzsimons — 28 September 2026**

Reworked traditional format with Word-style heading scale and format-specific content links.

- Removed section header eyebrow; first part of section is h1, rest are h2, only rule between sections
- Fixed flat-steps single-part sections now rendering their own heading
- Reordered format toggle to Traditional-then-Stepper
- Fixed contents list to use format-specific hrefs (stepper uses `?step=`, traditional uses in-page anchors)
