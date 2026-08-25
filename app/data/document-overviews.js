//
// Extra metadata for document-overview.html, keyed by the same id as
// app/data/search-results.js (name, description, status already live there —
// this only adds what that page does not need: scheme/topic, document type
// and a last updated date). Reuses saved-documents.js's own type and date
// for the three ids that are also in that list, so the same document does
// not read differently depending on which page shows it.
//

const documentOverviews = {
  'countryside-stewardship-capital-grants': {
    scheme: 'Countryside Stewardship',
    type: 'Guidance document',
    lastUpdated: '12 August 2026'
  },
  'basic-payment-scheme-closing-rules': {
    scheme: 'Basic Payment Scheme',
    type: 'Scheme handbook',
    lastUpdated: '5 August 2026'
  },
  'hedgerow-management-standards': {
    scheme: 'Cross Compliance',
    type: 'Guidance document',
    lastUpdated: '28 July 2026'
  },
  'sfi-soil-health-actions': {
    scheme: 'Sustainable Farming Incentive',
    type: 'Guidance document',
    lastUpdated: '3 July 2026'
  },
  'higher-tier-stewardship-options': {
    scheme: 'Countryside Stewardship',
    type: 'Policy',
    lastUpdated: '19 June 2026'
  }
}

module.exports = { documentOverviews }
