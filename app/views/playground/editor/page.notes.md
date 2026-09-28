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
