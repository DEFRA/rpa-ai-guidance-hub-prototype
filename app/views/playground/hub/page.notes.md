---
status: draft
url: /hub
---

**Shaun Fitzsimons — 28 September 2026**

Redesigned nav per brief: replace four-tab wizard layout with persistent context pane for expert user flow.

- Moves hub tabs (Recently opened, Saved, Editing, Awaiting approval) into right-side pane
- Hub itself becomes all-guidance list with inline filters/sort (replaces separate `/playground/hub/search` page)
- Role (viewer/designer) switchable from pane, controls content visibility
- Uses `app-full-width` layout to accommodate filters/results/pane row at wider than standard 960px
- Open: Should "View all" links on pane lists carry state filter across (currently don't, client-side filters only)

---

**Shaun Fitzsimons — 28 September 2026**

Two feedback rounds:

- Pane moved to leftmost column across all pages except editor (which uses full-width row below)
- Fixed View journey breadcrumbs: picker now links Home > title > overview > page; viewers use Back link instead of redundant breadcrumb pointing only to hub

---

**Shaun Fitzsimons — 28 September 2026**

Converted pane to accordion to reduce cognitive load when many sections visible at once.

- Each section one accordion item, only one expanded on load ("main info for that page")
- `rememberExpanded: false` to avoid leaking state between pages
- Traditional viewer's contents list folded into pane as Contents section (dropped to 2-column layout)
- Stepper keeps separate sidebar; each list in Your lists gets own collapsible item with count
- Search readout and recent searches always visible outside accordion

---

**Shaun Fitzsimons — 28 September 2026**

Moved collapse state server-side so it works without JavaScript and space reclaims to main content.

- `contextPaneCollapsed` now a session flag, Hide/Show are real forms posting to `/playground/context-pane-toggle`
- Pane column not rendered when collapsed; main content uses flex: 1 1 auto to reclaim width
- "Show context" form triggers pane when collapsed
- Added native CSS `resize: horizontal` handle (not remembered across reloads)
- Stepper viewer stays on grid, chooses column classes from `contextPane.collapsed` directly

---

**Shaun Fitzsimons — 28 September 2026**

Fixed resize handle: flex-basis was fixed, preventing width drag from taking effect.

- Changed to `flex: 0 0 auto` + plain `width: 300px` so drag actually works
- Added full-height border handle with Left/Right arrow key support
- Native corner grip stays as no-JS fallback
- Stepper viewer omitted due to grid column constraints

---

**Shaun Fitzsimons — 28 September 2026**

Redesigned filters from vertical sidebar to horizontal MoJ-style row; moved filtering server-side.

- Hand-ported MoJ filter shell to `.app-filter*` BEM
- Category/Scheme/Year are selects with accessible-autocomplete progressive enhancement; State checkboxes; Version dropped; Sort-by separate
- Filtering now server-side via `req.query` (category/scheme/year/state/sort/q); selected-filter tags and clear are plain links
- Works without JavaScript; enables closing "View all" gap for state filters
- Old styles in `_app-organic-search.scss` left for frozen snapshots/archived pages; new styles in `_app-filter.scss`

---

**Shaun Fitzsimons — 28 September 2026**

Replaced context pane with persistent side navigation on every playground page except sign-in.

- Nav shell rendered in `layouts/main.html` when `sideNav` is set; frozen versions keep GOV.UK markup
- Recently opened/Saved/Bookmarked/Awaiting review are `?list=` filters; case bookmarks are `?case=`; pinned guides sort first and appear in nav
- Pinned via star toggle on results and Pin button on document pages; case bookmarks created only from nav form, session-backed
- Hero moved beside nav (no longer full-bleed)
- Non-GDS: icon rail with tooltips, `<details>` for menus/role switcher, Ctrl/Cmd+K search, drawer on narrow screens without JS
- Dropped: Contents (restored in traditional viewer), This document, Related guidance, Recent searches
- Open: Help and Settings are placeholder links

---

**Shaun Fitzsimons — 28 September 2026**

Case bookmarks moved from nav to guide/document/viewer pages for accessibility; nav footer made sticky.

- "Bookmark to a case" now always-visible section with standard error handling (moved out of nav `<details>`)
- Each bookmark has type (Case ID/SBI), filters hub with `?case=` or `?sbi=`; nav shows type as text
- Nav footer sticky to viewport bottom, sized via JS with 100vh fallback; scroll padding clears focused items

---

**Shaun Fitzsimons — 28 September 2026**

Side nav is resizable via drag, Left/Right arrows (20px steps), or Home/End; double-click resets to 280px.

- Width 220–440px on desktop, saved per session as `--app-side-nav-width`, persists across pages
- Native corner grip works without JS; JS switches it off when script runs for single control
- Focused handle gets black inset outline for contrast against grey panel
- Known: links behind sticky footer may flag low target size in axe at certain scroll; reachable and keyboard focus scrolls clear

---

**Shaun Fitzsimons — 28 September 2026**

Side nav auto-collapses to icon rail at 769–1199px viewport width; pure CSS, no transition, works without JS.

- Manual collapse/expand saved per session, overrides auto-collapse at any width
- Expanding from rail posts `collapsed=false` form to avoid toggling back
- Below 769px drawer unchanged

---

**Tim Gordon — 2 October 2026**

API guides now sit alongside the mock guides instead of replacing them, so the mock journeys keep working whether or not the API has content.

- The API is used whenever `GUIDANCE_API_BASE_URL` is set; `GUIDANCE_API_ENABLED` is no longer needed for the playground (the frozen snapshots still use it)
- No manifest yet (404), an unreachable API or a slow one (3s timeout) leaves just the mock guides, with nothing logged for a 404
- Side nav lists and seeded bookmarks keep the mock guides too
- Open question: should an API guide replace a mock guide it duplicates, e.g. by matching manifest name to mock id?
