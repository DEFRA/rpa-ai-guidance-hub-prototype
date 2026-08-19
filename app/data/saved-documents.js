//
// Documents saved from an organic search, shown on the "Saved documents" tab
// of find-guidance.html. Organic search itself is not built yet — see
// organic-search.html — so these stand in as if that search had already
// found and saved them.
//
// Status follows the same idea as a guidance document's quality checks
// elsewhere in this hub, but at document level rather than finding level —
// whether the published text still matches the source it was written from,
// not whether it has open issues. Exactly one status per document: a real
// document would not be both up to date and out of date at once.
//
// Shared with app/routes.js, which uses id to look up the right document for
// saved-document-view.html, and with app/views/find-guidance.html for the
// table itself.
//

const savedDocuments = [
  {
    id: 'countryside-stewardship-capital-grants',
    name: 'Countryside Stewardship: capital grants',
    date: '12 August 2026',
    type: 'Guidance document',
    status: 'Up to date'
  },
  {
    id: 'basic-payment-scheme-closing-rules',
    name: 'Basic Payment Scheme: closing rules',
    date: '5 August 2026',
    type: 'Scheme handbook',
    status: 'Partially updated'
  },
  {
    id: 'hedgerow-management-standards',
    name: 'Hedgerow management standards',
    date: '28 July 2026',
    type: 'Guidance document',
    status: 'Out of date'
  }
]

module.exports = { savedDocuments }
