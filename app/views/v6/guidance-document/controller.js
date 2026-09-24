const library = require('../../../data/documents')
const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')
const {
  EDITOR_EXPERIMENT_CHECKS,
  EDITOR_EXPERIMENT_CHECK_SECTIONS
} = require('../../../data/editor-experiment')

const VALID_SEVERITIES = ['High', 'Medium', 'Low']

// Placeholder until the content panel is designed — see
// app/views/versions/v6/guidance-document.html. No backHref —
// guidance-document.html shows breadcrumbs instead of a Back link now.
//
// documentTitle/documentDescription (real, when :id matches) fix a real
// mismatch bug: "View issues" on manage-guidance/document-overview.html's
// own Publishing checks row used to link here with a hardcoded id
// ("sfi-23") regardless of which document's checks had actually just run,
// so this page always showed the fixed "SFI 23 Guidance document" sample
// no matter which real document sent someone here. That button now
// carries the real document.id through instead (see that page), and this
// looks it up the same way that page's own "View"/"Edit" already do —
// lookupAnyManageGuidanceDocument, not a plain guidanceDocuments lookup,
// since a Draft/Awaiting approval document (the only two states with a
// Publishing checks row to click "View issues" from) can be either a real
// guidanceDocuments entry or a sample Published document moved into
// Editing via "Start editing" (MANAGE_GUIDANCE_PUBLISHED_SAMPLES only).
// checks (EDITOR_EXPERIMENT_CHECKS, app/data/editor-experiment.js) is the
// same fixed Checks-tab list editor-2-3-view.html's own Checks panel
// renders — previously two independently hardcoded, silently-different
// lists (this page's own three severity tabs, that page's own flat
// list); single-sourced now, so the two genuinely show the same findings.
// There is still no real per-document quality-check dataset behind it
// (same gap "Publishing checks" on manage-guidance/document-overview.html
// already has) — only the title, description and each Issue's own link
// now genuinely belong to the document that was actually being reviewed,
// not the findings themselves, which are the same fixed set regardless of
// id. A direct visit with no :id, or one that matches nothing, falls back
// to the original fixed sample title/description exactly as before.
//
// activeSeverity (?severity=, from editor-2-3-view.html's own "Go to
// publishing checks page" link — app/views/v6/editor-2-3-view/controller.js's
// checkSeverity) opens straight onto the High/Medium/Low tab a check
// being reviewed there actually came from, rather than always this
// page's own default (High) regardless of where someone was. Falls back
// to "High" for anything else — no ?severity=, or one that isn't a real
// severity name — the same default the tabs already had before this.
function get(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)
  const activeSeverity = VALID_SEVERITIES.includes(req.query.severity)
    ? req.query.severity
    : 'High'

  res.render('versions/v6/guidance-document', {
    id: document ? document.id : null,
    documentTitle: document ? document.title : null,
    documentDescription: document ? document.description : null,
    checks: EDITOR_EXPERIMENT_CHECKS,
    checkSections: EDITOR_EXPERIMENT_CHECK_SECTIONS,
    activeSeverity
  })
}

// Matches the slug all-guidance-docs.html builds for each Recently added
// row's Edit link (document.name | lower | replace(":", "") |
// replace(" ", "-")), so the id in the URL can be traced back to which row
// was actually clicked.
function slugify(name) {
  return name.toLowerCase().replace(/:/g, '').replace(/ /g, '-')
}

// Straight into the markdown editor for a document, from the "Edit" button
// on a Recently added row — :id is only ever used to build this href. There
// is no per-document markdown yet, so every route into the editor still
// shares the one placeholder document/text — but the heading itself should
// match whichever row was clicked, so the id is matched back to its row
// here.
function getEdit(req, res) {
  const uploaded = library.batch.find(
    (document) => slugify(document.name) === req.params.id
  )

  res.locals.backHref = '/v6/all-guidance-docs'
  res.render('versions/v6/guidance-document-edit', {
    id: req.params.id,
    documentName: uploaded ? uploaded.name : library.current.name,
    documentPages: uploaded ? uploaded.pages : library.current.pages
  })
}

// A recommended change, opened from a change-review link elsewhere in the
// app (not from this route's own Issue links any more — those now go to
// /v6/editor-2-3-view instead, see get() above). The document text and
// finding shown are fixed placeholder content; this count is its own
// separate fixed placeholder too, unconnected to checks.length, so paging
// through issue numbers stops at a sensible boundary until real issue
// data exists.
const TOTAL_REVIEW_ISSUES = 10

function getReview(req, res) {
  const id = req.params.id
  const issueNumber = Math.min(
    Math.max(Number(req.params.issueNumber) || 1, 1),
    TOTAL_REVIEW_ISSUES
  )

  res.locals.backHref = `/v6/guidance-document/${id}`

  res.render('versions/v6/change-review', {
    id,
    issueNumber,
    totalIssues: TOTAL_REVIEW_ISSUES,
    previousIssueHref:
      issueNumber > 1
        ? `/v6/guidance-document/${id}/review/${issueNumber - 1}`
        : null,
    nextIssueHref:
      issueNumber < TOTAL_REVIEW_ISSUES
        ? `/v6/guidance-document/${id}/review/${issueNumber + 1}`
        : null
  })
}

module.exports = { get, getEdit, getReview }
