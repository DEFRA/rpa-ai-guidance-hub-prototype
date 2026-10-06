const { issuesViewModel } = require('../view-model')

const VERDICTS = ['fixed', 'wont_fix', 'false_positive']

function findingOr404(req, res, model) {
  const issue = model.document.issues.find(
    (candidate) => String(candidate.id) === req.params.id
  )
  if (!issue) {
    res
      .status(404)
      .render('playground/issues/findings/finding-not-found.njk', model)
  }
  return issue
}

function getFinding(req, res) {
  const model = issuesViewModel(req, req.params.guideId)
  const issue = findingOr404(req, res, model)
  if (!issue) return

  const { issues } = model.document
  const position = issues.indexOf(issue)

  res.render('playground/issues/findings/page.njk', {
    ...model,
    finding: issue,
    position: position + 1,
    total: issues.length,
    previousFinding: issues[position - 1],
    nextFinding: issues[position + 1]
  })
}

function postFinding(req, res) {
  const model = issuesViewModel(req, req.params.guideId)
  const issue = findingOr404(req, res, model)
  if (!issue) return

  if (VERDICTS.indexOf(req.body.verdict) === -1) {
    return res.redirect(`${model.base}/findings/${issue.id}`)
  }

  req.session.data.verdicts = req.session.data.verdicts || {}
  req.session.data.verdicts[issue.id] = {
    verdict: req.body.verdict,
    comment: (req.body.comment || '').trim()
  }

  const next = model.document.issues.find(
    (candidate) => candidate.id !== issue.id && !candidate.verdict
  )

  res.redirect(
    next ? `${model.base}/findings/${next.id}` : `${model.base}/review-complete`
  )
}

// Start the sub-journey at the first finding with no verdict yet.
function getFindingsStart(req, res) {
  const model = issuesViewModel(req, req.params.guideId)
  const next = model.document.outstanding[0]
  res.redirect(
    next ? `${model.base}/findings/${next.id}` : `${model.base}/review-complete`
  )
}

module.exports = { getFinding, postFinding, getFindingsStart }
