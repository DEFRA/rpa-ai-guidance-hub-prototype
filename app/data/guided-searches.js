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

// `name` reads as the enquiry someone typed, not a topic title — matching
// how a fresh search's heading on ai-search-results.html is the query
// itself. See topicHeadings there, which mirrors this text for the resumed
// case rather than reading it from here, so the two need updating together.
const guidedSearches = [
  {
    id: 'sfi-eligibility',
    name: 'How do I evidence eligibility for the Sustainable Farming Incentive?',
    lastOpened: '17 August 2026',
    totalSteps: 4,
    resumeStep: 2
  },
  {
    id: 'countryside-stewardship',
    name: 'What capital items are covered under Countryside Stewardship grants?',
    lastOpened: '15 August 2026',
    totalSteps: 3,
    resumeStep: 1
  },
  {
    id: 'cross-compliance-livestock',
    name: 'What are the cross compliance rules I need to follow for livestock?',
    lastOpened: '10 August 2026',
    totalSteps: 4,
    resumeStep: 4
  },
  {
    id: 'payment-deadlines',
    name: 'When are the payment deadlines for my agreement this year?',
    lastOpened: '2 August 2026',
    totalSteps: 5,
    resumeStep: 3
  }
]

module.exports = { guidedSearches }
