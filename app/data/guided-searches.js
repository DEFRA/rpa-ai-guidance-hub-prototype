//
// AI-guided searches already run, shown on the "Guided searches" tab of
// find-guidance.html. Each one resumes at a fixed step rather than the
// start, and has its own number of steps — Countryside Stewardship is a
// shorter topic than Payment deadlines, for instance, so the two don't share
// a step count.
//
// Shared with app/routes.js, which uses id/totalSteps/resumeStep to work out
// valid step numbers and the name shown on the delete confirmation page, and
// with app/views/ai-search-results.html, which uses id to look up the right
// placeholder content and name for that topic's heading.
//
// documentId points "Open" on find-guidance.html at the closest existing
// document in app/data/search-results.js / saved-document-view.html's own
// content, rather than back into the step-by-step guided results screen —
// the nearest topical match where these five example enquiries don't have a
// document of their own.
//

// `name` reads as a plain document title, shown on the "Recently opened" tab
// of find-guidance.html — it does not have to double as the enquiry someone
// typed any more. ai-search-results.html keeps its own separate
// topicHeadings for the heading text a resumed search shows, so the two are
// independent and do not need updating together.
const guidedSearches = [
  {
    id: 'sfi-eligibility',
    name: 'Sustainable Farming Incentive eligibility',
    lastOpened: '17 August 2026',
    totalSteps: 4,
    resumeStep: 2,
    documentId: 'sfi-soil-health-actions'
  },
  {
    id: 'countryside-stewardship',
    name: 'Countryside Stewardship capital grants',
    lastOpened: '15 August 2026',
    totalSteps: 3,
    resumeStep: 1,
    documentId: 'countryside-stewardship-capital-grants'
  },
  {
    id: 'cross-compliance-livestock',
    name: 'Cross compliance rules for livestock',
    lastOpened: '10 August 2026',
    totalSteps: 4,
    resumeStep: 4,
    documentId: 'hedgerow-management-standards'
  },
  {
    id: 'payment-deadlines',
    name: 'Payment deadlines 2026',
    lastOpened: '2 August 2026',
    totalSteps: 5,
    resumeStep: 3,
    documentId: 'basic-payment-scheme-closing-rules'
  }
]

module.exports = { guidedSearches }
