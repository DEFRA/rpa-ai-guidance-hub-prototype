const library = require('../../../data/documents')

// Placeholder until the content panel is designed — see
// app/views/versions/v6/guidance-document.html. No backHref —
// guidance-document.html shows breadcrumbs instead of a Back link now.
function get(req, res) {
  res.render('versions/v6/guidance-document')
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

// A recommended change, opened from the guidance document overview. The
// document text, the finding shown and this count are all fixed placeholder
// content, but the count matches the severity totals shown there (3 high +
// 5 medium + 2 low), so paging through issue numbers stops at a sensible
// boundary until real issue data exists.
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
