# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service — don't add resilience, security, or performance work nobody asked for.

## Structure

- `app/routes.js` is a loader only: it walks `app/views` for `routes.js` files and requires each one. Add a page by adding a folder under `app/views`, not by editing this file.
- `app/views/legacy/routes.js` holds every route not yet migrated to its own page module (most of v1/v2/v3/v4, and most of v5). It's required explicitly first by the loader because it carries the site-wide middleware (navigation, per-version header state, the journey/quality-check locals other routes still rely on).
- A page module lives at `app/views/<page>/`: `routes.js` (paths only), `controller.js` (glue — read the request, call data, render), `view-model.js` (all display shaping), `page.njk` (template, extends a `common/layouts/*` variant). `app/views/v5/find-guidance/` is the worked example to copy. Only build a full module when a page has branching, validation, or real data shaping — a static page is just a template.
- `app/views/common/layouts/` has `base.njk` (chrome, extends `layouts/main.html`), `content.njk` (two-thirds column shape), `hub.njk` (full-width landing shape), and `not-found.njk`. Page modules extend one of these, never `layouts/main.html` directly.
- `app/views/layouts/main.html` is the Defra-branded chrome (header/footer/phase banner/back link/quality-checks script) that `common/layouts/base.njk` extends.
- `app/data/prototypes.js` defines every prototype version and journey; the versions list at `/` is generated entirely from this file, via `app/lib/prototypes.js`'s `getVersions()`.
- `app/data/*.js` is data access, no presentation. A helper shared by more than one version or page (e.g. `guidance-lists.js`) lives here once — don't duplicate it per route.
- `app/assets/javascripts/quality-checks.js` is a shared client+server rules engine, required by the routes and also loaded in the browser.

## Prototype versions

Multiple rounds of research live side by side rather than overwriting each other. Do not treat this as dead code to clean up.

| Version | Status     | URL prefix | Views                                                                               |
| ------- | ---------- | ---------- | ----------------------------------------------------------------------------------- |
| v1      | superseded | `/v1/`     | `app/views/versions/v1/**`                                                          |
| v2      | archived   | `/v2/`     | `app/views/versions/v2/**`                                                          |
| v3      | superseded | `/v3/`     | `app/views/versions/v3/**`                                                          |
| v4      | superseded | `/v4/`     | `app/views/versions/v4/**`                                                          |
| v5      | current    | `/v5/`     | `app/views/versions/v5/**`, plus page modules such as `app/views/v5/find-guidance/` |

Rules to follow:

- A `/vN/...` route renders from `app/views/versions/vN/...`, not `app/views/vN/...`.
- Add a new version by adding an entry to `app/data/prototypes.js` (`id`/`name`/`status`/`entryHref`/`summary`) — never hand-edit `index.html`, it's generated from that file.
- Only work on the current version, **v5**. Never edit a frozen version's routes, views, or URLs. If a path must change, add a redirect from the old path rather than removing it — old research links and bookmarks depend on it staying live.

## Adding a page

- Static, no branching: a template only, extending `common/layouts/content.njk` or `hub.njk`. Do not scaffold a routes/controller/view-model trio for a page that doesn't need one.
- Branching, validation, or real data shaping: a full page module under `app/views/v5/<page>/`, following `app/views/v5/find-guidance/`. Keep controllers as glue only — sorting, formatting, and href-building belong in the view model, not the controller or the template.
- Put session-backed data shared across pages or versions in `app/data/`, not inline in a route handler.

## Conventions

- Node v24 is used locally even though the GOV.UK Prototype Kit officially supports v16–22 — watch for compatibility quirks the kit hasn't been tested against.
- Run `npm run format` (or check with `npm run format:check`) — Prettier — before committing.
- Never put real personal data in `app/data/session-data-defaults.js` or any committed file — made-up names and addresses only.
