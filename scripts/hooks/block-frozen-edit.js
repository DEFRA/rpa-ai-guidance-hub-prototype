#!/usr/bin/env node
//
// Claude Code PreToolUse hook, wired up in .claude/settings.json against
// Edit/Write/MultiEdit/NotebookEdit. Blocks any edit whose target file sits
// inside a frozen snapshot (an app/views/<id>/ directory containing a
// .snapshot.json, written by scripts/snapshot.js) — the same immutability
// scripts/check-frozen.js enforces in CI for anything that slips past this.
//
// Fails open on anything unexpected (missing/malformed stdin, a path we
// can't make sense of): this is a dev-experience guard, not a security
// boundary, so a false negative is fine and a false positive that blocks a
// legitimate edit elsewhere in the repo is not.
//

const fs = require('fs')
const path = require('path')

const repoRoot = path.join(__dirname, '..', '..')
const viewsDir = path.join(repoRoot, 'app', 'views')

function allow() {
  process.exit(0)
}

function block(reason) {
  console.error(reason)
  process.exit(2)
}

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'))
  } catch {
    return null
  }
}

// Handles the shapes this hook has actually been seen to receive
// (file_path for Edit/Write, notebook_path for NotebookEdit) plus a
// defensive fallback for a possible multi-edit shape, rather than assuming
// one exact schema.
function targetPathFrom(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null

  return (
    toolInput.file_path ||
    toolInput.notebook_path ||
    toolInput.edits?.[0]?.file_path ||
    null
  )
}

function frozenSnapshotFor(absolutePath) {
  const relative = path.relative(viewsDir, absolutePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null

  const snapshotId = relative.split(path.sep)[0]
  const manifest = path.join(viewsDir, snapshotId, '.snapshot.json')

  return fs.existsSync(manifest) ? snapshotId : null
}

function main() {
  const payload = readStdinJson()
  const targetPath = payload && targetPathFrom(payload.tool_input)
  if (!targetPath) return allow()

  const absolutePath = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(payload.cwd || repoRoot, targetPath)

  const snapshotId = frozenSnapshotFor(absolutePath)
  if (!snapshotId) return allow()

  block(
    `"${snapshotId}" is a frozen snapshot (app/views/${snapshotId}/) — it must not be edited.\n` +
      `If the prototype needs to change, edit app/views/playground/ instead and take a fresh snapshot with \`npm run snapshot -- "<name>"\`.`
  )
}

main()
