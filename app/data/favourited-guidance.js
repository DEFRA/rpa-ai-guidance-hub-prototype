//
// Guidance documents favourited for quick access, shown on the "Favourited
// guidance" tab of find-guidance.html — a different way back to a document
// besides picking it up again through search. documentId points at the same
// documents app/data/search-results.js already describes, via the read-only
// view at /find-guidance/document/:documentId, rather than inventing a
// second set of documents for one table.
//
// "Steps left" does not really apply to a document rather than a search in
// progress, but the Favourited guidance table matches Saved searches'
// column structure — see find-guidance.html — so it reads "-" there instead
// of the column being dropped.
//
// Shared with app/routes.js, which also checks here (after
// app/data/guided-searches.js) when resolving /find-guidance/delete/:id, so
// deleting a favourite shows its name on delete-search-confirm.html rather
// than the generic fallback.
//

const favouritedGuidance = [
  {
    id: 'hedgerow-management-standards-fav',
    name: 'Hedgerow management standards',
    lastOpened: '20 August 2026',
    documentId: 'hedgerow-management-standards'
  },
  {
    id: 'higher-tier-stewardship-options-fav',
    name: 'Higher Tier stewardship options',
    lastOpened: '14 August 2026',
    documentId: 'higher-tier-stewardship-options'
  },
  {
    id: 'sfi-soil-health-actions-fav',
    name: 'Sustainable Farming Incentive: soil health actions',
    lastOpened: '9 August 2026',
    documentId: 'sfi-soil-health-actions'
  }
]

module.exports = { favouritedGuidance }
