---
status: retired
---

**Shaun Fitzsimons — 28 September 2026**

Full port of retired `/v6/manage-guidance/search-guidance` page replacing title-match table.

- Rebuilt `overviewHref` as `/playground/document/:id` (was v6's `?id=` style)
- Uses existing "Back" link instead of breadcrumb
- Open: state tag reads "Awaiting review" (data value), should it be "Awaiting approval" (tab label)?

---

**Shaun Fitzsimons — 28 September 2026**

Retired as own page; navigation redesign folds four tabs into pane and makes hub the all-guidance list. Routes redirect `/playground/hub/search` (preserving `?q=`) to `/playground/hub`; filters/results now in `hub/page.njk`.
