# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service.

## Structure

- `app/routes.js` — a loader only: walks `app/views` for `routes.js` files and requires each one. Add a page by adding a folder, not by editing this file.
- `app/views/legacy/routes.js` — every route not yet migrated to its own page module (most of v1/v2/v3/v4, and most of v5). Required explicitly first by the loader, since it carries the site-wide middleware (navigation, per-version header state, the journey/quality-check locals other routes still rely on).
- `app/views/<page>/` — a page module: `routes.js` (paths only), `controller.js` (glue — reads the request, calls data, renders), `view-model.js` (all display shaping), `page.njk` (template, extends a `common/layouts/*` variant). See `app/views/v5/find-guidance/` for a worked example. Only build a full module when a page has branching, validation, or real data shaping — a static page is just a template.
- `app/views/common/layouts/` — `base.njk` (chrome, extends `layouts/main.html`), `content.njk` (two-thirds column shape), `hub.njk` (full-width landing shape), `not-found.njk`. Page modules extend one of these, not `layouts/main.html` directly.
- `app/views/layouts/main.html` — the Defra-branded chrome (header/footer/phase banner/back link/quality-checks script). This is what `common/layouts/base.njk` extends.
- `app/data/prototypes.js` — defines every prototype version and journey; the versions list at `/` is generated entirely from this file, via `app/lib/prototypes.js`'s `getVersions()`.
- `app/data/*.js` — data access, no presentation. A helper shared by more than one version or page (e.g. `guidance-lists.js`) lives here once, not duplicated per route.
- `app/assets/javascripts/quality-checks.js` — shared client+server rules engine (required by the routes, loaded in the browser too).
- `app/config.json` — prototype kit config (e.g. `rebrand` toggle for GOV.UK brand refresh).

## Prototype versions

Multiple rounds of research live side by side rather than overwriting each other:

| Version | Status     | URL prefix | Views                                                                               |
| ------- | ---------- | ---------- | ----------------------------------------------------------------------------------- |
| v1      | superseded | `/v1/`     | `app/views/versions/v1/**`                                                          |
| v2      | archived   | `/v2/`     | `app/views/versions/v2/**`                                                          |
| v3      | superseded | `/v3/`     | `app/views/versions/v3/**`                                                          |
| v4      | superseded | `/v4/`     | `app/views/versions/v4/**`                                                          |
| v5      | current    | `/v5/`     | `app/views/versions/v5/**`, plus page modules such as `app/views/v5/find-guidance/` |

- A `/vN/...` route renders from `app/views/versions/vN/...`, not `app/views/vN/...` — `app/lib/prototypes.js`'s `stepExists` knows this convention; keep it in mind if you add version-aware logic elsewhere.
- Add a new version by adding an entry (`id`/`name`/`status`/`entryHref`/`summary`) to `app/data/prototypes.js` — don't hand-edit `index.html`, it's generated.
- Only v2's designer journeys model full `steps`/`journeys` (they drive the phase banner's "step X of Y"). Every other version is a list-only entry with `journeys: []` — don't model a version's pages as journey steps unless something actually reads `journeyStep`/`backHref`/`nextHref` for it.
- Only work on the current version (**v5**) going forward. Never edit a frozen version's routes, views, or URLs — if a path has to change, add a redirect from the old one rather than removing it (research links/bookmarks depend on old URLs staying live).

## Adding a page

- Static, no branching: a template only (e.g. `app/views/v5/some-page.njk`), extending `common/layouts/content.njk` or `hub.njk`. Don't scaffold a routes/controller/view-model trio for this.
- Branching, validation, or real data shaping: a full page module under `app/views/v5/<page>/`, following `app/views/v5/find-guidance/`. Controllers stay glue — no sorting, formatting, or href-building in them; that belongs in the view model.
- Session-backed data shared across pages or versions goes in `app/data/`, not inline in a route handler.

## Leaving notes on a page

A "Notes" panel (`app/views/partials/notes-panel.njk`), toggled from the footer on every page across every version, is a designer/dev tool for tracking changes and commenting on decisions — not part of any journey being prototyped. It's inspired by "Alan" in `defra-design/fcp-farming-front-door`, but instead of hand-copying metadata into every template, a page's notes live in a `*.notes.json` file sitting next to its template (`app/lib/page-notes.js` resolves which one, reusing the `/vN/...` → `app/views/versions/vN/...` convention above):

- A flat template, e.g. `app/views/versions/v3/foo.njk`, pairs with `app/views/versions/v3/foo.notes.json`.
- A page module's `page.njk` pairs with `page.notes.json` in the same folder — see `app/views/v5/find-guidance/page.notes.json` for a worked example.

Shape: `{ "status": "...", "url": "...", "notes": [{ "author": "...", "date": "...", "text": "..." }] }`, all optional. `url` is the designer-intended URL slug for the real service (e.g. `/find-guidance`) — this is _not_ the prototype's own `/v5/...` route, which is why it's a field to set rather than read from the request; leave it out for a page with no settled slug yet. There's no runtime store or way to add a note from the browser — write the file and commit it, same as any other prototype change. No file means the panel just shows an empty-state hint.

## Dev server

Runs on **Node v24** locally, though the GOV.UK Prototype Kit officially supports v16–22 — be alert to compatibility quirks the kit hasn't been tested against on newer Node versions.

## Notes

- Not production code: no resilience, security, or performance guarantees are expected here.
- Format with `npm run format` (check with `npm run format:check`, Prettier) before committing.
- No real personal data in `app/data/session-data-defaults.js` or any committed file — made-up names and addresses only.
