const qualityChecks = require('../../../assets/javascripts/quality-checks')
const sampleDocument = require('../../../data/sample-document')
const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

const VERDICTS = {
  fixed: { text: 'Fixed', classes: 'govuk-tag--green' },
  wont_fix: { text: "Won't fix", classes: 'govuk-tag--grey' },
  false_positive: { text: 'False positive', classes: 'govuk-tag--blue' }
}

const issuesBase = (id) => `/playground/issues/${encodeURIComponent(id)}`

// The mock quality-check run: every guide is checked against the same sample
// document, so there are always example issues to review.
function mockIssueCount() {
  return qualityChecks.findIssues(sampleDocument).length
}

// What the issues pages show for a guide: its findings (with any recorded
// verdicts), grouped and counted, plus the hrefs between the pages.
function issuesViewModel(req, id) {
  const guide = lookupAnyManageGuidanceDocument(id)
  const base = issuesBase(id)
  const verdicts = req.session.data.verdicts || {}

  const issues = qualityChecks.findIssues(sampleDocument).map((issue) => {
    const recorded = verdicts[issue.id]
    return {
      ...issue,
      verdict: recorded && recorded.verdict,
      verdictTag: recorded && VERDICTS[recorded.verdict],
      comment: recorded && recorded.comment,
      href: `${base}/findings/${issue.id}`
    }
  })
  const outstanding = issues.filter((issue) => !issue.verdict)
  const resolved = issues.filter((issue) => issue.verdict)

  return {
    guideName: guide ? guide.title : 'Guide',
    guideHref: `/playground/guide/${encodeURIComponent(id)}`,
    base,
    editorHref: `/playground/editor?id=${encodeURIComponent(id)}`,
    stepThroughHref: `${base}/findings`,
    document: {
      markdown: sampleDocument,
      issues,
      outstanding,
      resolved,
      verdictCounts: Object.keys(VERDICTS).reduce((counts, verdict) => {
        counts[verdict] = resolved.filter(
          (issue) => issue.verdict === verdict
        ).length
        return counts
      }, {}),
      counts: qualityChecks.severityCounts(issues),
      split: qualityChecks.split(issues)
    }
  }
}

module.exports = { issuesViewModel, issuesBase, mockIssueCount }
