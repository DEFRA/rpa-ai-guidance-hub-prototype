# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service.

## Structure

- `app/routes.js` — a loader only: walks `app/views` for `routes.js` files and requires each one. Add a page by adding a folder, not by editing this file.
- `app/views/legacy/routes.js` — every route not yet migrated to its own page module (most of v1/v2/v3/v4, and most of v5). v6 has none left here — every one of its routes lives in its own module under `app/views/v6/`. Required explicitly first by the loader, since it carries the site-wide middleware (navigation, per-version header state, the journey/quality-check locals other routes still rely on).
- `app/views/<page>/` — a page module: `routes.js` (paths only), `controller.js` (glue — reads the request, calls data, renders), `view-model.js` (all display shaping), `page.njk` (template, extends a `common/layouts/*` variant). See `app/views/v5/find-guidance/` for a worked example of one module, or `app/views/v6/` for a whole version built this way. Only add `controller.js`/`view-model.js` once a page needs them (see "Adding a page" below) — but every page still gets its own `routes.js`, never a handler added to `legacy/routes.js`.
- `app/views/common/layouts/` — `base.njk` (chrome, extends `layouts/main.html`), `content.njk` (two-thirds column shape), `hub.njk` (full-width landing shape), `not-found.njk`. Page modules extend one of these, not `layouts/main.html` directly.
- `app/views/layouts/main.html` — the Defra-branded chrome (header/footer/phase banner/back link/quality-checks script). This is what `common/layouts/base.njk` extends.
- `app/data/prototypes.js` — defines every prototype version and journey; the versions list at `/` is generated entirely from this file, via `app/lib/prototypes.js`'s `getVersions()`.
- `app/data/*.js` — data access, no presentation. A helper shared by more than one version or page (e.g. `guidance-lists.js`) lives here once, not duplicated per route.
- `app/assets/javascripts/quality-checks.js` — shared client+server rules engine (required by the routes, loaded in the browser too).
- `app/config.json` — prototype kit config (e.g. `rebrand` toggle for GOV.UK brand refresh).

## Prototype versions

Multiple rounds of research live side by side rather than overwriting each other:

| Version | Status     | URL prefix | Views                                                                                                                                                                      |
| ------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | superseded | `/v1/`     | `app/views/versions/v1/**`                                                                                                                                                 |
| v2      | archived   | `/v2/`     | `app/views/versions/v2/**`                                                                                                                                                 |
| v3      | superseded | `/v3/`     | `app/views/versions/v3/**`                                                                                                                                                 |
| v4      | superseded | `/v4/`     | `app/views/versions/v4/**`                                                                                                                                                 |
| v5      | archived   | `/v5/`     | `app/views/versions/v5/**`, plus one page module, `app/views/v5/find-guidance/`                                                                                            |
| v6      | current    | `/v6/`     | Routes/controllers/view-models: `app/views/v6/**` (every page has its own module). Templates: still `app/views/versions/v6/**` — see the note under "Adding a page" below. |

- A `/vN/...` route renders from `app/views/versions/vN/...`, not `app/views/vN/...` — `app/lib/prototypes.js`'s `stepExists` knows this convention; keep it in mind if you add version-aware logic elsewhere. This is about where a version's _templates_ live, not its routes — v6's routes live in `app/views/v6/**` (see below) while still rendering `versions/v6/**` templates.
- Add a new version by adding an entry (`id`/`name`/`status`/`entryHref`/`summary`) to `app/data/prototypes.js` — don't hand-edit `index.html`, it's generated.
- Only v2's designer journeys model full `steps`/`journeys` (they drive the phase banner's "step X of Y"). Every other version is a list-only entry with `journeys: []` — don't model a version's pages as journey steps unless something actually reads `journeyStep`/`backHref`/`nextHref` for it.
- Only work on the current version (**v6**) going forward. Never edit a frozen version's routes, views, or URLs — if a path has to change, add a redirect from the old one rather than removing it (research links/bookmarks depend on old URLs staying live).
- **v6 sets the required structure for any new version from here on** (see "Adding a page" below): every page gets its own module under `app/views/vN/<page>/`, from the version's first commit — never a batch of handlers dropped into `legacy/routes.js` "for now". v1–v5 predate this and are frozen anyway, so they're left as they are rather than retrofitted.

## Adding a page

Every page in the current version (v6) gets its own folder under `app/views/v6/<page>/` with a `routes.js` — never a handler added to `legacy/routes.js`. From there, build up only what the page needs, following `app/views/v6/`'s own three tiers:

- Just wiring (a render call, maybe a redirect, nothing to shape): `routes.js` alone, calling `res.render`/`res.redirect` directly. See `app/views/v6/sign-in/`.
- Some glue, but nothing worth shaping separately (a lookup, a simple branch): add `controller.js`. See `app/views/v6/guidance-document/`.
- Branching, validation, or real data shaping (sorting, building rows, assembling props): add `view-model.js` too, and keep the controller as glue only — no sorting, formatting, or href-building in it; that belongs in the view model. See `app/views/v6/find-guidance/`.

A page module's `page.njk` (extending `common/layouts/content.njk` or `hub.njk`) sits in the same folder as its `routes.js` — see `app/views/v5/find-guidance/` for a worked example. v6 is a partial exception: its templates still render from `app/views/versions/v6/**` (carried over unchanged when its routes were pulled out of `legacy/routes.js`) rather than living next to their modules — don't repeat that split for a page or version built fresh; put `page.njk` in the module folder from the start.

Session-backed data shared across pages or versions goes in `app/data/`, not inline in a route handler.

If a page has a designer-intended URL slug for the real service, set it in that page's `*.notes.md` (see "Leaving notes on a page" below) rather than leaving it implicit in a commit message or ticket — that's what the `url` front matter field is for.

Where a page's pattern or component isn't already settled by existing notes, research findings, or explicit user instruction, default to the GOV.UK Design System's guidance (the `gds-patterns`/`gds-components` skills) rather than improvising one — and record the choice in the page's notes if it's non-obvious.

## Leaving notes on a page

A "Notes" panel (`app/views/partials/notes-panel.njk`), toggled by a tab docked to the right edge of the screen on every page across every version, is a designer/dev tool for tracking changes and commenting on decisions — not part of any journey being prototyped. It's inspired by "Alan" in `defra-design/fcp-farming-front-door`, but instead of hand-copying metadata into every template, a page's notes live in a `*.notes.md` file sitting next to its template (`app/lib/page-notes.js` resolves which one, reusing the `/vN/...` → `app/views/versions/vN/...` convention above):

- A flat template, e.g. `app/views/versions/v3/foo.njk`, pairs with `app/views/versions/v3/foo.notes.md`.
- A page module's `page.njk` pairs with `page.notes.md` in the same folder — see `app/views/v5/find-guidance/page.notes.md` for a worked example.

Shape: an optional `---`-delimited front matter block with flat `status:`/`url:` fields, then a freeform markdown body — write it however reads best, e.g. a bold `**Author — date**` line per entry with `---` between them. The body is rendered with `marked` (see `app/lib/page-notes.js`), so headings, bullets, bold/italic and links all work. `url` is the designer-intended URL slug for the real service (e.g. `/find-guidance`) — this is _not_ the prototype's own `/v5/...` route, which is why it's a field to set rather than read from the request; leave it out for a page with no settled slug yet. There's no runtime store or way to add a note from the browser — write the file and commit it, same as any other prototype change. No file means the panel just shows an empty-state hint.

Use this file, not just the commit message, to carry the reasoning behind a page's design: whenever a change to a page is more than mechanical (a layout or content decision, a call made in response to research or stakeholder feedback, a deliberate scope cut), add a dated `**Author — date**` entry explaining why, separated from the previous entry with `---`. This applies when adding a page too — a first entry noting what it's for and any open questions is more useful to the next person than an empty notes file. Commit messages describe the change; the notes file is where the justification for a page's current shape lives and accumulates, so read the existing entries before changing a page that already has them.

## Dev server

Runs on **Node v24** locally, though the GOV.UK Prototype Kit officially supports v16–22 — be alert to compatibility quirks the kit hasn't been tested against on newer Node versions.

## Notes

- Not production code: no resilience, security, or performance guarantees are expected here.
- Format with `npm run format` (check with `npm run format:check`, Prettier) before committing.
- No real personal data in `app/data/session-data-defaults.js` or any committed file — made-up names and addresses only.
