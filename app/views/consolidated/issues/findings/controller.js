const VERDICTS = ['fixed', 'wont_fix', 'false_positive']

function findingOr404(req, res) {
  const issue = res.locals.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue) {
    res.status(404).render('consolidated/issues/findings/finding-not-found.njk')
  }
  return issue
}

function getFinding(req, res) {
  const issue = findingOr404(req, res)
  if (!issue) return

  const { issues } = res.locals.document
  const position = issues.indexOf(issue)

  res.render('consolidated/issues/findings/page.njk', {
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

module.exports = { getFinding, postFinding, getFindingsStart }
