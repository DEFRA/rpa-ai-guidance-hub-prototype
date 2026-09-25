const {
  buildManageGuidanceSearchResults
} = require('../../../../data/manage-guidance')

// A simplified stand-in for the retired manage-guidance/search-guidance
// page's faceted filter UI — the consolidation plan's flowchart doesn't
// include search as part of the proposed unified journey, so this keeps
// the hub's search box genuinely working (a plain name match over every
// document across every state) without carrying over that page's
// Category/State/Scheme/Year facets, which are out of scope here.
function get(req, res) {
  const query = (req.query.q || '').trim()
  const allResults = buildManageGuidanceSearchResults(
    req,
    '/consolidated/document'
  )

  const results = query
    ? allResults.filter((document) =>
        document.title.toLowerCase().includes(query.toLowerCase())
      )
    : []

  res.locals.backHref = '/consolidated/hub'
  res.render('consolidated/hub/search/page.njk', { query, results })
}

module.exports = { get }
