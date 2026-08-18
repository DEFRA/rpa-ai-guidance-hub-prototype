//
// Example results for organic-search.html. Organic search itself is not
// built — see organic-search.html — so this is a fixed list rather than
// anything actually matched against a query or the filters on that page.
//
// Three of these ids are also in app/data/saved-documents.js: the same
// underlying document, already saved from an earlier search. The other two
// are not saved yet, so "Save to your searches" on organic-search.html has
// something real to demonstrate — though it does not actually add them
// there, since nothing in this static prototype persists that state.
//
// Shared with app/routes.js, which falls back to this list when resolving
// /find-guidance/document/:id for an id that is not in saved-documents.js.
//

const searchResults = [
  {
    id: 'countryside-stewardship-capital-grants',
    name: 'Countryside Stewardship: capital grants',
    description: 'Explains the capital items available under Countryside Stewardship, including fencing and hedgerow restoration, and how to apply for a grant.',
    status: 'Up to date'
  },
  {
    id: 'basic-payment-scheme-closing-rules',
    name: 'Basic Payment Scheme: closing rules',
    description: 'Sets out what still applies to farmers with BPS entitlements or open legacy claims now the scheme has closed to new claims.',
    status: 'Partially updated'
  },
  {
    id: 'hedgerow-management-standards',
    name: 'Hedgerow management standards',
    description: 'Covers cutting dates, buffer strips and record keeping for hedgerows under cross compliance and SFI actions.',
    status: 'Out of date'
  },
  {
    id: 'sfi-soil-health-actions',
    name: 'Sustainable Farming Incentive: soil health actions',
    description: 'Explains the soil health actions available under SFI 23, what evidence to keep, and how they interact with other actions on the same land.',
    status: 'Up to date'
  },
  {
    id: 'higher-tier-stewardship-options',
    name: 'Higher Tier stewardship options',
    description: 'An overview of the options available under a Higher Tier Countryside Stewardship agreement and how they differ from Mid Tier.',
    status: 'Partially updated'
  }
]

module.exports = { searchResults }
