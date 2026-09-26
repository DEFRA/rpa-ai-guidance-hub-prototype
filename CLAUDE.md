# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service.

## Structure

- `app/routes.js` — a loader only: walks `app/views/playground` (plus every frozen snapshot directory — see "Snapshots" below) for `routes.js` files and requires each one. Add a page by adding a folder, not by editing this file.
- `app/views/playground/` — the current, live prototype: one coherent journey built from the best page of each prior version (see "Prototype versions" below), and the one place ongoing/mob prototyping happens. Follows the same page-module shape as v6 did (see "Adding a page" below), just without v6's templates-vs-routes split — a page's `routes.js`/`controller.js`/`view-model.js`/`page.njk` all live together in its own folder.
- `app/views/<snapshot-id>/` — a frozen, point-in-time copy of `app/views/playground/`, taken with `npm run snapshot -- "<name>"` ahead of a research session. See "Snapshots" below.
- `app/views/legacy/routes.js` — every route not yet migrated to its own page module (most of v1/v2/v3/v4, and most of v5). Required explicitly first by the loader, since it carries the site-wide middleware (navigation, per-version header state, the journey/quality-check locals other routes still rely on).
- `app/views/<page>/` — a page module: `routes.js` (paths only), `controller.js` (glue — reads the request, calls data, renders), `view-model.js` (all display shaping), `page.njk` (template, extends a `common/layouts/*` variant). See `app/views/v5/find-guidance/` for a worked example of one module, or `app/views/playground/` for a whole version built this way. Only add `controller.js`/`view-model.js` once a page needs them (see "Adding a page" below) — but every page still gets its own `routes.js`, never a handler added to `legacy/routes.js`.
- `scripts/` — the snapshot tooling (`snapshot.js`, `check-frozen.js`, the `hooks/` Claude Code hook, shared `lib/` helpers). See `scripts/README.md` and "Snapshots" below.
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
- Only work on the current version — **`app/views/playground/`** — going forward; v1–v6 are frozen/archived (superseded by the consolidation into playground) and left as they are rather than retrofitted. Never edit a frozen version's routes, views, or URLs — if a path has to change, add a redirect from the old one rather than removing it (research links/bookmarks depend on old URLs staying live).
- Playground (and v6 before it) set the required structure for any new page from here on (see "Adding a page" below): every page gets its own module under `app/views/playground/<page>/`, never a batch of handlers dropped into `legacy/routes.js` "for now".

## Snapshots

Playground is edited incrementally (including mob/pairing sessions), so it doesn't stay stable enough on its own to be "what participants saw" in a given round of research. Ahead of a UR session (or any time a point-in-time copy is worth keeping), freeze one with:

```
npm run snapshot
```

Run with no flags in a real terminal and it prompts for what it needs: a **name** (short identifier), the **purpose** (why this snapshot is being taken), and an optional line-by-line **summary of what's changed** since the last one. It auto-detects the **author** (from `git config user.name`/`user.email`, overridable) and the **date and time**, and auto-generates a `git diff --stat` against the previous snapshot's source commit as a supplementary, no-effort record of what changed at the file level.

Run from somewhere without a terminal attached — CI, or an AI coding agent such as Claude Code or GitHub Copilot driving a shell — and it never blocks waiting for input: pass `--name`/`--purpose` (required) and `--change`/`--author` (optional, `--change` repeatable) as flags instead, e.g. `npm run snapshot -- --name "UR round 4" --purpose "..." --change "..."`. Missing a required flag with no terminal attached is a hard, immediate error explaining what to pass — never a hang.

This copies `app/views/playground/` into a new `app/views/<YYYY-MM-DD>-<slug>/` directory (rewriting its routes/render paths so they don't collide with playground or other snapshots), adds an `archived` entry for it to `app/data/prototypes.js`, writes a human-readable `FROZEN.md` with all of the above, and writes a `.snapshot.json` manifest recording the same metadata plus every file's hash — that manifest is what makes a directory "frozen": there's no separate registry, just that file's presence.

A frozen snapshot must never be edited afterwards:

- A Claude Code hook (`scripts/hooks/block-frozen-edit.js`, wired up in `.claude/settings.json`) blocks Edit/Write/MultiEdit/NotebookEdit calls targeting a file inside one.
- `npm run check:frozen` re-hashes every snapshot against its manifest and fails if anything has drifted — this runs in CI on every pull request (`.github/workflows/checks.yml`), so a hand edit that bypasses the hook still gets caught.

If a snapshotted page turns out to need a change, edit `app/views/playground/` and take a fresh snapshot — don't edit the old one. See `scripts/README.md` for how the pieces fit together.

## Adding a page

Every page in the current version (playground) gets its own folder under `app/views/playground/<page>/` with a `routes.js` — never a handler added to `legacy/routes.js`. From there, build up only what the page needs, following `app/views/playground/`'s own three tiers:

- Just wiring (a render call, maybe a redirect, nothing to shape): `routes.js` alone, calling `res.render`/`res.redirect` directly. See `app/views/playground/sign-in/`.
- Some glue, but nothing worth shaping separately (a lookup, a simple branch): add `controller.js`. See `app/views/playground/document/`.
- Branching, validation, or real data shaping (sorting, building rows, assembling props): add `view-model.js` too, and keep the controller as glue only — no sorting, formatting, or href-building in it; that belongs in the view model. See `app/views/playground/upload/`.

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
