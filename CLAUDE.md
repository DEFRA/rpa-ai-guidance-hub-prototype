# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service.

## Structure

- `app/routes.js` — a loader only: walks `app/views/playground` (plus every frozen snapshot directory — see "Snapshots" below) for `routes.js` files and requires each one. Add a page by adding a folder, not by editing this file.
- Side navigation: `app/views/playground/routes.js` (a playground-root middleware, required first by the loader) sets `sideNav` from `app/data/side-nav.js`, and `layouts/main.html` wraps the page in the nav shell only when `sideNav` is set — so every playground page but sign-in gets it, and frozen versions/snapshots render the plain GOV.UK markup. Partials: `partials/side-nav.njk`, `side-nav-rail.njk`. The old context pane files stay only because the `2026-09-27-context-pane` snapshot still renders them.
- `app/views/playground/` — the current, live prototype: one coherent journey built from the best page of each prior version (see "Prototype versions" below), and the one place ongoing/mob prototyping happens. Follows the same page-module shape as v6 did (see "Adding a page" below), just without v6's templates-vs-routes split — a page's `routes.js`/`controller.js`/`view-model.js`/`page.njk` all live together in its own folder.
- `app/views/<snapshot-id>/` — a frozen, point-in-time copy of `app/views/playground/`, taken with `npm run snapshot -- "<name>"` ahead of a research session. See "Snapshots" below.
- `app/views/archive/` — v1–v6 and the pre-page-module `legacy/routes.js`, left in place when they were consolidated into playground. `app/routes.js`'s loader only walks `app/views/playground` and frozen snapshots, so nothing under `archive/` is wired up, has a live URL, or appears on the `/` index any more — it's a historical reference only. See "Prototype versions" below.
- `app/views/<page>/` — a page module: `routes.js` (paths only), `controller.js` (glue — reads the request, calls data, renders), `view-model.js` (all display shaping), `page.njk` (template, extends a `common/layouts/*` variant). See `app/views/archive/find-guidance/` for a worked example of one module, or `app/views/playground/` for a whole version built this way. Only add `controller.js`/`view-model.js` once a page needs them (see "Adding a page" below) — but every page still gets its own `routes.js`, never a batch of handlers dropped into one shared file.
- `scripts/` — the snapshot tooling (`snapshot.js`, `check-frozen.js`, the `hooks/` Claude Code hook, shared `lib/` helpers). See `scripts/README.md` and "Snapshots" below.
- `app/views/common/layouts/` — `base.njk` (chrome, extends `layouts/main.html`), `content.njk` (two-thirds column shape), `hub.njk` (full-width landing shape), `not-found.njk`. Page modules extend one of these, not `layouts/main.html` directly.
- `app/views/layouts/main.html` — the Defra-branded chrome (header/footer/phase banner/back link/quality-checks script). This is what `common/layouts/base.njk` extends.
- `app/data/prototypes.js` — defines every prototype version and journey; the versions list at `/` is generated entirely from this file, via `app/lib/prototypes.js`'s `getVersions()`.
- `app/data/*.js` — data access, no presentation. A helper shared by more than one version or page (e.g. `guidance-lists.js`) lives here once, not duplicated per route.
- `app/assets/javascripts/quality-checks.js` — shared client+server rules engine (required by the routes, loaded in the browser too).
- `app/config.json` — prototype kit config (e.g. `rebrand` toggle for GOV.UK brand refresh).

## Prototype versions

Earlier rounds of research — v1–v6, plus the pre-page-module `legacy` routes — were consolidated into **`app/views/playground/`**, and the old files moved to `app/views/archive/`. `app/routes.js`'s loader only walks `app/views/playground` and frozen snapshots, so nothing under `archive/` is wired up any more, has a live URL, or is listed in `app/data/prototypes.js`/the `/` index — it's kept only as a historical reference, not a running version of the prototype.

- Only work on **`app/views/playground/`** going forward. Don't retrofit or revive anything under `archive/` — if an old page is needed again, rebuild it as a playground page module (see "Adding a page" below).
- Treat `archive/` the same as a frozen snapshot even though it predates that tooling and has no `.snapshot.json` of its own: don't edit it.
- A round of research worth preserving going forward is captured with `npm run snapshot` (see "Snapshots" below) rather than by keeping an old version live.
- Add a new prototype version by adding an entry (`id`/`name`/`status`/`entryHref`/`summary`) to `app/data/prototypes.js` — don't hand-edit `index.html`, it's generated.

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

Every page in the current version (playground) gets its own folder under `app/views/playground/<page>/` with a `routes.js` — never a batch of handlers dropped into a shared routes file. From there, build up only what the page needs, following `app/views/playground/`'s own three tiers:

- Just wiring (a render call, maybe a redirect, nothing to shape): `routes.js` alone, calling `res.render`/`res.redirect` directly. See `app/views/playground/sign-in/`.
- Some glue, but nothing worth shaping separately (a lookup, a simple branch): add `controller.js`. See `app/views/playground/document/`.
- Branching, validation, or real data shaping (sorting, building rows, assembling props): add `view-model.js` too, and keep the controller as glue only — no sorting, formatting, or href-building in it; that belongs in the view model. See `app/views/playground/upload/`.

A page module's `page.njk` (extending `common/layouts/content.njk` or `hub.njk`) sits in the same folder as its `routes.js` — see `app/views/archive/find-guidance/` for a worked example.

Session-backed data shared across pages or versions goes in `app/data/`, not inline in a route handler.

If a page has a designer-intended URL slug for the real service, set it in that page's `*.notes.md` (see "Leaving notes on a page" below) rather than leaving it implicit in a commit message or ticket — that's what the `url` front matter field is for.

Where a page's pattern or component isn't already settled by existing notes, research findings, or explicit user instruction, default to the GOV.UK Design System's guidance (the `gds-patterns`/`gds-components` skills) rather than improvising one — and record the choice in the page's notes if it's non-obvious.

## Leaving notes on a page

A "Notes" panel (`app/views/partials/notes-panel.njk`), toggled by a tab docked to the right edge of the screen on every page across every version, is a designer/dev tool for tracking changes and commenting on decisions — not part of any journey being prototyped. It's inspired by "Alan" in `defra-design/fcp-farming-front-door`, but instead of hand-copying metadata into every template, a page's notes live in a `*.notes.md` file sitting next to its template (`app/lib/page-notes.js` resolves which one):

- Every playground page module's `page.njk` pairs with `page.notes.md` in the same folder — see `app/views/archive/find-guidance/page.notes.md` for a worked example (kept from before the consolidation, but still the pattern every playground page module follows).
- A handful of flat templates, e.g. `app/views/archive/versions/v3/foo.njk`, still pair with a `foo.notes.md` the same way, using the `/vN/...` → `.../versions/vN/...` convention `app/lib/view-paths.js` implements — though nothing under `app/views/archive/` is reachable by URL any more (see "Prototype versions" above), so this only matters if you're reading an archived note by hand.

Shape: an optional `---`-delimited front matter block with flat `status:`/`url:` fields, then a freeform markdown body — write it however reads best, e.g. a bold `**Author — date**` line per entry with `---` between them. The body is rendered with `marked` (see `app/lib/page-notes.js`), so headings, bullets, bold/italic and links all work. `url` is the designer-intended URL slug for the real service (e.g. `/find-guidance`) — this is _not_ the prototype's own `/playground/...` route, which is why it's a field to set rather than read from the request; leave it out for a page with no settled slug yet. There's no runtime store or way to add a note from the browser — write the file and commit it, same as any other prototype change. No file means the panel just shows an empty-state hint.

Use this file, not just the commit message, to carry the reasoning behind a page's design: whenever a change to a page is more than mechanical (a layout or content decision, a call made in response to research or stakeholder feedback, a deliberate scope cut), add a dated `**Author — date**` entry explaining why, separated from the previous entry with `---`. Keep each entry short — a one-sentence summary of the decision, plus up to five bullets only if there's more worth calling out (what changed, why, open questions); never a multi-paragraph explanation. This applies when adding a page too — a first entry noting what it's for and any open questions is more useful to the next person than an empty notes file. Commit messages describe the change; the notes file is where the justification for a page's current shape lives and accumulates, so read the existing entries before changing a page that already has them.

## Dev server

Runs on **Node v24** locally, though the GOV.UK Prototype Kit officially supports v16–22 — be alert to compatibility quirks the kit hasn't been tested against on newer Node versions.

## Notes

- Not production code: no resilience, security, or performance guarantees are expected here.
- Format with `npm run format` (check with `npm run format:check`, Prettier) before committing.
- No real personal data in `app/data/session-data-defaults.js` or any committed file — made-up names and addresses only.
- Keep code comments succinct: a one-or-two-sentence justification only — not multi-paragraph explanations. For `*.notes.md` entries, see the format rule under "Leaving notes on a page" above.
