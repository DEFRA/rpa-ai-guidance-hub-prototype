# Scripts

Tooling for the snapshot system described in the root `CLAUDE.md`'s
"Snapshots" section.

- `snapshot.js` — `npm run snapshot`. Freezes the current state of
  `app/views/playground/` into a new `app/views/<date>-<slug>/` directory,
  adds an entry for it to `app/data/prototypes.js`, and writes a
  `.snapshot.json` manifest recording name, purpose, author, changes, an
  auto-generated `git diff --stat` since the last snapshot, and every file's
  hash. Interactive (prompts for name/purpose/changes, auto-detects author
  from git) when run in a real terminal; non-interactive when it isn't — pass
  `--name`/`--purpose` (required) and `--change`/`--author` (optional,
  `--change` repeatable) instead, e.g. for a CI job or an AI coding agent
  driving a shell. Run with `--help` for the full flag list.
- `check-frozen.js` — `npm run check:frozen`. Re-hashes every frozen
  snapshot and reports any drift against its manifest. Exits non-zero on
  drift, so it also gates `.github/workflows/checks.yml` on pull requests.
- `hooks/block-frozen-edit.js` — a Claude Code `PreToolUse` hook (wired up in
  `.claude/settings.json`) that blocks Edit/Write/MultiEdit/NotebookEdit
  calls targeting a file inside a frozen snapshot.
- `lib/` — helpers shared between the above: `slugify.js`, `rewrite-paths.js`
  (rewrites a copied snapshot's internal `/playground/...` references to its
  own id), and `manifest.js` (the hashing used by both `snapshot.js` and
  `check-frozen.js`).

A directory under `app/views/` is only ever treated as a frozen snapshot
because it contains a `.snapshot.json` — there's no separate registry to keep
in sync.
