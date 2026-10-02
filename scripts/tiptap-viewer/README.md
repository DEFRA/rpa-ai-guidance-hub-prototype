# TipTap guide viewer

Renders a guide's converted Markdown (`app/data/guides/<id>/content.md`) on the playground guide page with the same TipTap schema the real guidance editor ships with. That way research participants see what the production viewer would show, not an approximation of it.

- `src/extensions.js`, `src/coloured-text.js`, `src/tables.js` and `src/text-colours.js` are copied byte-for-byte (plus one header line) from `rpa-ai-guidance-hub-ui`'s `scripts/preview-markdown/` at `6b7f2ba`, on branch `rai-72-word-to-markdown-conversion`. Don't edit them here; they're in `.prettierignore` so they stay diffable against upstream.
- `src/viewer.js` is this repo's own entry point. It mounts a read-only `Editor` on every `[data-tiptap-markdown]` element (see `app/views/playground/guide/partials/reading-content.njk`).
- `build.js` bundles both into `app/assets/javascripts/vendor/tiptap-viewer.js`. The bundle is **committed**, so the kit and the CDP deploy need no build step, and the `@tiptap/*` packages are dev dependencies only.

## Rebuild

```
npm run build:tiptap
```

Commit the regenerated `vendor/tiptap-viewer.js` (about 550 KB minified) alongside whatever changed. Source maps are off because the map is about 3 MB; turn `sourcemap` on in `build.js` locally when debugging.

## Re-sync with upstream

1. Copy the four files again from `rpa-ai-guidance-hub-ui/scripts/preview-markdown/`, keeping the one-line header (with the new commit).
2. Match the `@tiptap/*` versions in `package.json` to the UI repo's.
3. Run `npm run build:tiptap` and commit.
