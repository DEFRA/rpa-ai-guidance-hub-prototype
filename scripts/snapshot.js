#!/usr/bin/env node
//
// npm run snapshot                                      (interactive)
// npm run snapshot -- --name "..." --purpose "..."      (non-interactive)
//
// Freezes the current state of app/views/playground/ into its own directory
// so it can be shown in a research session and never accidentally edited
// afterwards. See CLAUDE.md's "Snapshots" section for the full picture:
// this script does the copying and bookkeeping, scripts/hooks/block-frozen-edit.js
// blocks edits to the result, and scripts/check-frozen.js (npm run
// check:frozen) verifies nothing has drifted since.
//
// Run with no flags in a real terminal and it prompts for what it needs.
// Run from somewhere without a terminal attached — a CI job, or an AI coding
// agent such as Claude Code or GitHub Copilot driving a shell — and it never
// blocks waiting for input: pass everything as flags instead, or it exits
// with a usage message explaining which ones are missing.
//

const fs = require('fs')
const path = require('path')
const os = require('os')
const readline = require('readline/promises')
const { execFileSync } = require('child_process')
const { parseArgs } = require('util')

const { slugify } = require('./lib/slugify')
const { rewritePlaygroundReferences } = require('./lib/rewrite-paths')
const { hashDir, MANIFEST_FILE } = require('./lib/manifest')

const repoRoot = path.join(__dirname, '..')
const viewsDir = path.join(repoRoot, 'app', 'views')
const playgroundDir = path.join(viewsDir, 'playground')
const prototypesFile = path.join(repoRoot, 'app', 'data', 'prototypes.js')

// A real terminal on both ends — otherwise rl.question() would hang forever
// waiting for input that's never coming (a CI runner, or an agent's non-tty
// shell), so anything not supplied by flags must be treated as a hard error
// instead of a prompt.
const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY)

const USAGE = `Usage:
  npm run snapshot                     interactive — prompts for everything below
  npm run snapshot -- [flags]          non-interactive — for CI or an AI coding agent

Flags:
  --name <text>       required   short identifier, e.g. "UR round 4"
  --purpose <text>    required   why this snapshot is being taken
  --change <text>     optional, repeatable   one line per notable change since
                       the last snapshot, e.g. --change "Reworked the upload flow"
  --author <text>     optional   overrides the git-detected author
`

function fail(message) {
  console.error(`snapshot: ${message}`)
  process.exit(1)
}

function gitOutput(args) {
  return execFileSync('git', args, { cwd: repoRoot }).toString().trim()
}

// Matches the project's own `format`/`format:check` npm scripts, so a
// snapshot's copied-then-rewritten files pass `npm run format:check` (and
// therefore CI) the same as anything else in the repo, and the manifest
// hashed just after this reflects the same content the repo will actually
// hold once committed.
function runPrettier(pathOrGlob) {
  try {
    execFileSync('npx', ['prettier', '--write', pathOrGlob], {
      cwd: repoRoot,
      stdio: 'ignore'
    })
  } catch {
    console.warn(
      `snapshot: could not run prettier on ${pathOrGlob} — run \`npm run format\` before committing`
    )
  }
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// "Who made it" — the git identity of whoever is running the command, since
// that's the person to credit even when an agent is driving the shell on
// their behalf. Just the name (in this project, git's user.name is set to a
// GitHub handle) — no email, which would just be noise on the index page's
// summary card. Falls back to the OS account name if git has no identity
// configured (or isn't installed), rather than failing the whole snapshot
// over metadata.
function detectAuthor() {
  try {
    const name = gitOutput(['config', 'user.name'])
    if (name) return name
  } catch {
    // no git identity configured — fall through to the OS username
  }

  try {
    return os.userInfo().username
  } catch {
    return 'unknown'
  }
}

// The most recently taken snapshot (if any), used as the baseline for the
// auto-generated "what's changed" diff — a snapshot is only comparable to
// whatever came immediately before it, not to every snapshot ever taken.
function findPreviousSnapshot() {
  const manifests = fs
    .readdirSync(viewsDir)
    .map((entry) => path.join(viewsDir, entry, MANIFEST_FILE))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))

  if (manifests.length === 0) return null

  manifests.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))
  return manifests[0]
}

// A file-level summary of what's changed in the playground since the
// previous snapshot's source commit — git diff already knows this, so it's
// free, automatic detail alongside whatever the author manually notes.
// Comparing against a commit (rather than another snapshot's rewritten
// copy) also picks up any uncommitted changes on top of it, since a bare
// `git diff <commit>` compares against the working tree.
function diffStatSince(prevCommit) {
  if (!prevCommit) return null

  try {
    return (
      gitOutput(['diff', '--stat', prevCommit, '--', 'app/views/playground']) ||
      null
    )
  } catch {
    return null
  }
}

async function ask(rl, question, { required = false } = {}) {
  for (;;) {
    const answer = (await rl.question(question)).trim()
    if (answer || !required) return answer
    console.log('  (required)')
  }
}

async function askChanges(rl) {
  console.log(
    "Summary of what's changed since the last snapshot (one line per change, blank line to finish — optional):"
  )
  const changes = []

  for (;;) {
    const line = (await rl.question('  - ')).trim()
    if (!line) return changes
    changes.push(line)
  }
}

// Fills in whatever wasn't already supplied as a flag by prompting for it —
// only reachable when isInteractive is true, so every rl.question() here is
// guaranteed to get an answer rather than hang.
async function promptForMissing(fields) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    const name =
      fields.name ||
      (await ask(rl, 'Snapshot name (e.g. "UR round 4"): ', {
        required: true
      }))

    const purpose =
      fields.purpose ||
      (await ask(rl, 'Purpose — why is this snapshot being taken? ', {
        required: true
      }))

    const changes =
      fields.changes.length > 0 ? fields.changes : await askChanges(rl)

    const detectedAuthor = fields.author || detectAuthor()
    const authorAnswer = await ask(rl, `Author [${detectedAuthor}]: `)
    const author = authorAnswer || detectedAuthor

    return { name, purpose, changes, author }
  } finally {
    rl.close()
  }
}

function requireNonInteractiveFields(fields) {
  const missing = []
  if (!fields.name) missing.push('--name')
  if (!fields.purpose) missing.push('--purpose')

  if (missing.length > 0) {
    fail(
      `missing ${missing.join(', ')} — no terminal is attached to prompt for them.\n\n${USAGE}`
    )
  }

  return {
    name: fields.name,
    purpose: fields.purpose,
    changes: fields.changes,
    author: fields.author || detectAuthor()
  }
}

function parseCliArgs() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      name: { type: 'string' },
      purpose: { type: 'string' },
      change: { type: 'string', multiple: true },
      author: { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    },
    allowPositionals: true
  })

  if (values.help) {
    console.log(USAGE)
    process.exit(0)
  }

  return {
    // A single bare positional is accepted as a shorthand for --name, for
    // anyone used to the old `npm run snapshot -- "<name>"` form.
    name: values.name || positionals.join(' ').trim() || undefined,
    purpose: values.purpose,
    changes: values.change || [],
    author: values.author
  }
}

function writeFrozenNotice(
  dir,
  { name, purpose, author, changes, when, diffStat }
) {
  const changesSection =
    changes.length > 0
      ? `## What changed\n\n${changes.map((c) => `- ${c}`).join('\n')}\n\n`
      : ''

  const diffSection = diffStat
    ? `## Files changed since the last snapshot\n\n\`\`\`\n${diffStat}\n\`\`\`\n\n`
    : ''

  fs.writeFileSync(
    path.join(dir, 'FROZEN.md'),
    `# Frozen snapshot: ${name}\n\n` +
      `- **Taken:** ${when}\n` +
      `- **By:** ${author}\n` +
      `- **Purpose:** ${purpose}\n\n` +
      changesSection +
      diffSection +
      `Do not edit anything in this directory — a Claude Code hook and a CI ` +
      `check both enforce this (see CLAUDE.md's "Snapshots" section and ` +
      `scripts/README.md). If the prototype needs to change, edit ` +
      `app/views/playground/ and take a new snapshot instead.\n`
  )
}

// The exact marker comment app/data/prototypes.js is seeded with, right
// after the playground entry — present in the gap before the very first
// snapshot is appended, and no longer relevant (but harmless to also match)
// once at least one snapshot already sits after it.
const MARKER =
  '// Snapshots below this line are appended by scripts/snapshot.js — do not\n' +
  '    // hand-edit. Run `npm run snapshot` to add one.'

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Matches the last object literal in the `versions` array (always closed by
// a 4-space-indented "}", our own convention) through to the end of the
// file, capturing whether it already has a trailing comma and whatever sits
// between it and the closing "]" (nothing, or the marker comment above).
// Needed because Prettier strips the trailing comma from whichever entry is
// currently last every time it formats the file, so that can't be relied on
// to already be there from a previous run.
const TAIL_RE = new RegExp(
  `\\n( {4}\\})(,)?(\\s*(?:${escapeRegExp(MARKER)})?\\s*)\\]\\n\\}\\s*$`
)

function insertVersionEntry(id, { name, purpose, author, changes, when }) {
  const content = fs.readFileSync(prototypesFile, 'utf8')
  const match = content.match(TAIL_RE)

  if (!match) {
    fail(
      `could not find the end of the versions array in ${path.relative(repoRoot, prototypesFile)} — has its shape changed?`
    )
  }

  const [, brace, , trivia] = match

  // No `summary` field — app/lib/prototypes.js's buildSummaryRows() shows
  // `purpose` and `author` as their own rows on the index page's summary
  // card instead of folding them into one sentence.
  const entry =
    `    {\n` +
    `      id: ${JSON.stringify(id)},\n` +
    `      name: ${JSON.stringify(name)},\n` +
    `      status: 'archived',\n` +
    `      date: ${JSON.stringify(when)},\n` +
    `      entryHref: ${JSON.stringify(`/${id}/`)},\n` +
    `      purpose: ${JSON.stringify(purpose)},\n` +
    `      author: ${JSON.stringify(author)},\n` +
    `      changes: ${JSON.stringify(changes)},\n` +
    `      journeys: []\n` +
    `    },\n`

  const updated =
    content.slice(0, match.index) + `\n${brace},${trivia}` + entry + `  ]\n}\n`

  fs.writeFileSync(prototypesFile, updated)
}

async function main() {
  const cliFields = parseCliArgs()

  if (!fs.existsSync(playgroundDir)) {
    fail(`app/views/playground does not exist`)
  }

  const fields = isInteractive
    ? await promptForMissing(cliFields)
    : requireNonInteractiveFields(cliFields)

  const now = new Date()
  const isoDate = now.toISOString().slice(0, 10)
  const id = `${isoDate}-${slugify(fields.name)}`
  const snapshotDir = path.join(viewsDir, id)

  if (fs.existsSync(snapshotDir)) {
    fail(
      `app/views/${id} already exists — a snapshot with this name was already taken today`
    )
  }

  const previousSnapshot = findPreviousSnapshot()

  let sourceCommit
  let dirty = false

  try {
    sourceCommit = gitOutput(['rev-parse', '--short', 'HEAD'])
    dirty = gitOutput(['status', '--porcelain']).length > 0
  } catch {
    console.warn(
      'snapshot: could not read git state (not a git repo, or git is unavailable) — continuing without it'
    )
  }

  if (dirty) {
    console.warn(
      'snapshot: the working tree has uncommitted changes — the snapshot will reflect what is on disk right now, not the last commit'
    )
  }

  const diffStat = diffStatSince(previousSnapshot?.sourceCommit)

  fs.cpSync(playgroundDir, snapshotDir, { recursive: true })
  rewritePlaygroundReferences(snapshotDir, id)

  const when = formatDateTime(now)
  writeFrozenNotice(snapshotDir, { ...fields, when, diffStat })
  runPrettier(`${path.relative(repoRoot, snapshotDir)}/**/*.{cjs,js,json,md}`)

  const files = hashDir(snapshotDir)
  fs.writeFileSync(
    path.join(snapshotDir, MANIFEST_FILE),
    JSON.stringify(
      {
        id,
        name: fields.name,
        purpose: fields.purpose,
        author: fields.author,
        changes: fields.changes,
        takenAt: now.toISOString(),
        sourceCommit,
        dirty,
        diffStat,
        files
      },
      null,
      2
    ) + '\n'
  )

  insertVersionEntry(id, { ...fields, when })
  runPrettier(path.relative(repoRoot, prototypesFile))

  console.log('')
  console.log(`Snapshot "${id}" created.`)
  console.log(`  - app/views/${id}/ (frozen copy of playground)`)
  console.log(`  - app/data/prototypes.js updated with a new entry`)
  console.log('')
  console.log(
    `Review the changes, then commit app/views/${id}/ and app/data/prototypes.js.`
  )
}

main()
