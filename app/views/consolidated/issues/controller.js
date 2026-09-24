// The canonical quality-check pages — the consolidation plan's "no debate"
// decision, ported from /v2/designer/documents/issues + .../findings/:id.
// /v5/guidance-document/sfi-23, V6's in-editor Checks tab and the
// standalone /v6/guidance-document/:id are all retired; every "View
// issues"/"Start Checks" button in the consolidated build points here.
//
// res.locals.document/library/fixVariant (the quality-check state itself)
// are already set by app/views/legacy/routes.js' site-wide middleware,
// which runs ahead of every route including this one — reused as-is here,
// not rebuilt, same as V2's own routes already do. Only editorHref/
// stepThroughHref/fixHref (which page each button leads to) are
// overridden below, to point at the consolidated editor/step-through
// rather than that middleware's own retired-V2 defaults.

const VERDICTS = ['fixed', 'wont_fix', 'false_positive']

function withConsolidatedHrefs(res) {
  res.locals.editorHref = '/consolidated/editor'
  res.locals.stepThroughHref = '/consolidated/issues/findings'
  if (res.locals.fixVariant === 'editor') {
    res.locals.fixHref = '/consolidated/editor'
  } else if (res.locals.fixVariant === 'step-through') {
    res.locals.fixHref = '/consolidated/issues/findings'
  }
}

function getIssues(req, res) {
  withConsolidatedHrefs(res)
  res.render('consolidated/issues/issues.njk')
}

function findingOr404(req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue) res.status(404).render('consolidated/issues/finding-not-found.njk')
  return issue
}

function getFinding(req, res) {
  const issue = findingOr404(req, res)
  if (!issue) return

  const { issues } = res.locals.document
  const position = issues.indexOf(issue)

  res.render('consolidated/issues/finding.njk', {
    finding: issue,
    position: position + 1,
    total: issues.length,
    previousFinding: issues[position - 1],
    nextFinding: issues[position + 1]
  })
}

function postFinding(req, res) {
  const issue = findingOr404(req, res)
  if (!issue) return

  if (VERDICTS.indexOf(req.body.verdict) === -1) {
    return res.redirect(`/consolidated/issues/findings/${issue.id}`)
  }

  req.session.data.verdicts = req.session.data.verdicts || {}
  req.session.data.verdicts[issue.id] = {
    verdict: req.body.verdict,
    comment: (req.body.comment || '').trim()
  }

  const next = res.locals.document.issues.find(
    (candidate) => candidate.id !== issue.id && !candidate.verdict
  )

  res.redirect(
    next
      ? `/consolidated/issues/findings/${next.id}`
      : '/consolidated/issues/review-complete'
  )
}

// Start the sub-journey at the first finding with no verdict yet.
function getFindingsStart(req, res) {
  const next = res.locals.document.outstanding[0]
  res.redirect(
    next
      ? `/consolidated/issues/findings/${next.id}`
      : '/consolidated/issues/review-complete'
  )
}

function getReviewComplete(req, res) {
  res.render('consolidated/issues/review-complete.njk')
}

function getReviewReset(req, res) {
  delete req.session.data.verdicts
  res.redirect('/consolidated/issues')
}

module.exports = {
  getIssues,
  getFinding,
  postFinding,
  getFindingsStart,
  getReviewComplete,
  getReviewReset
}
