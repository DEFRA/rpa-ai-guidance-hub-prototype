---
status: draft
---

**Shaun Fitzsimons — 28 September 2026**

Added context pane as full-width row below columns, collapsed by default (not fourth column).

- Three columns already tight; floating-comment tracking depends on editor box width
- Pane's designer content useful but not needed in eyeline while editing

---

**Shaun Fitzsimons — 28 September 2026**

Moved collapse state server-side via `buildContextPane` resolving session flag instead of template toggle.

---

**Shaun Fitzsimons — 28 September 2026**

Context pane removed (replaced by side navigation). Switched off 100vw breakout (`.app-experiment-page`) on side-nav pages to avoid overflow; three columns and floating comments unchanged. Collapse nav to rail for more editing room (preference persists).

---

**Shaun Fitzsimons — 5 October 2026**

The editor is the guide's one draft: it opens only for people who can edit, and only while the draft is a Draft. Awaiting review is locked, so it goes back to the guide page instead.

---

**Shaun Fitzsimons — 5 October 2026**

Toolbar fixed and the editor now loads the selected guide's own content (API, `content.md` and mock guides).

- Toolbar sticks to the top of the editor pane, spans its full width and is one tab stop (arrow keys move within it). It was 60% of the pane and not sticky.
- Icons are Material Symbols (`material-symbols`, vendored by `npm run update:vendor`), not inline SVG.
- Buttons now format text via `document.execCommand`; task/lettered lists, image and search are still visual only. Open question: move to Tiptap?
- Save / Preview / Send for approval still sit in the left column; a sticky action bar may suit better.

---

**Shaun Fitzsimons — 5 October 2026**

Editor layout now follows the viewer: a Contents list on the left and the shared "About this guide" panel on the right, with Comments and Checks in that panel.

- Contents is plain links like the viewer's (parts indented), keeping the drag handles for reordering.
- The Changes column is gone; the panel's own collapse and resize replace "Hide". Comment cards stack in the panel rather than lining up with their anchors.
- Comments start empty (no seeded threads); so do Pinned guidance and Case bookmarks.
- Open question: Checks are still fixed sample data.
