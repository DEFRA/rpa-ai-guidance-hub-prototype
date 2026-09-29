# Frozen snapshot: Sidenav First Prototype

- **Taken:** 29 September 2026 at 17:47
- **By:** sfitz42
- **Purpose:** Save first side nav prototype after UR

## Files changed since the last snapshot

```
app/views/playground/case-bookmarks/add/routes.js  |  23 +
 .../playground/case-bookmarks/remove/routes.js     |  13 +
 app/views/playground/document/controller.js        |  11 +-
 app/views/playground/document/page.njk             | 117 +---
 app/views/playground/document/page.notes.md        |  40 ++
 .../playground/document/start-editing/routes.js    |  11 +-
 app/views/playground/document/view-model.js        |  23 +-
 app/views/playground/document/view/controller.js   |  54 +-
 app/views/playground/document/view/page.njk        |  44 +-
 app/views/playground/document/view/page.notes.md   |  27 +
 app/views/playground/document/view/routes.js       |  16 +-
 .../playground/document/view/stepper/controller.js | 104 +--
 .../playground/document/view/stepper/page.njk      |  56 +-
 .../playground/document/view/stepper/page.notes.md |  48 ++
 .../playground/document/view/stepper/routes.js     |   9 +-
 .../document/view/traditional/controller.js        | 103 +--
 .../playground/document/view/traditional/page.njk  |  59 +-
 .../document/view/traditional/page.notes.md        |  36 +
 .../playground/document/view/traditional/routes.js |   9 +-
 app/views/playground/editor/page.notes.md          |  22 +
 app/views/playground/guide/bookmark/controller.js  |  55 ++
 app/views/playground/guide/bookmark/page.njk       |  83 +++
 app/views/playground/guide/bookmark/page.notes.md  |  13 +
 app/views/playground/guide/bookmark/routes.js      |  10 +
 app/views/playground/guide/bookmark/view-model.js  |  56 ++
 app/views/playground/guide/controller.js           |  38 +
 app/views/playground/guide/guide-content.js        | 128 ++++
 app/views/playground/guide/guide-metadata.js       |  46 ++
 app/views/playground/guide/page.njk                | 157 +++++
 app/views/playground/guide/page.notes.md           |  72 ++
 app/views/playground/guide/panel-toggle/routes.js  |  17 +
 app/views/playground/guide/panel-width/routes.js   |  15 +
 .../playground/guide/partials/case-bookmarks.njk   |  44 ++
 .../playground/guide/partials/editor-controls.njk  |  56 ++
 .../playground/guide/partials/format-toggle.njk    |  19 +
 .../playground/guide/partials/metadata-list.njk    |  45 ++
 .../playground/guide/partials/reading-content.njk  | 170 +++++
 app/views/playground/guide/routes.js               |   7 +
 app/views/playground/guide/view-model.js           | 397 +++++++++++
 app/views/playground/hub/controller.js             |   9 +-
 app/views/playground/hub/page.njk                  | 765 ++++++++-------------
 app/views/playground/hub/page.notes.md             | 115 ++++
 .../playground/hub/remove-confirm/controller.js    |   5 +-
 app/views/playground/hub/remove-confirm/page.njk   |   3 +-
 app/views/playground/hub/remove/controller.js      |  10 +-
 app/views/playground/hub/save-to-search/routes.js  |   2 +-
 app/views/playground/hub/search/controller.js      |  28 -
 app/views/playground/hub/search/page.njk           |  56 --
 app/views/playground/hub/search/page.notes.md      |  17 +
 app/views/playground/hub/search/routes.js          |  12 +-
 app/views/playground/hub/view-model.js             | 335 ++++++++-
 app/views/playground/pin-toggle/routes.js          |  17 +
 app/views/playground/routes.js                     |  18 +
 app/views/playground/side-nav/toggle/routes.js     |  15 +
 app/views/playground/side-nav/width/routes.js      |  14 +
 app/views/playground/sign-in/controller.js         |  17 +
 app/views/playground/sign-in/page.njk              |  35 +-
 app/views/playground/sign-in/routes.js             |  10 +-
 app/views/playground/switch-role/routes.js         |  13 +
 app/views/playground/upload/converted/page.njk     |  20 +-
 app/views/playground/upload/page.njk               |  82 ++-
 app/views/playground/upload/page.notes.md          |   8 +
 62 files changed, 2756 insertions(+), 1103 deletions(-)
```

Do not edit anything in this directory — a Claude Code hook and a CI check both enforce this (see CLAUDE.md's "Snapshots" section and scripts/README.md). If the prototype needs to change, edit app/views/playground/ and take a new snapshot instead.
