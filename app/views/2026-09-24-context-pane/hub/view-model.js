const {
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')
const {
  buildContextPane,
  addRecentSearch
} = require('../../../data/context-pane')

// Slug (querystring/form value) -> full label (the value buildManageGuidance
// SearchResults' documents actually carry) for each single-choice facet.
const CATEGORY_LABELS = {
  sfi: 'Sustainable Farming Incentive',
  'countryside-stewardship': 'Countryside Stewardship',
  'cross-compliance': 'Cross Compliance'
}
const SCHEME_LABELS = {
  'countryside-stewardship': 'Countryside Stewardship',
  'sustainable-farming-incentive': 'Sustainable Farming Incentive'
}
const STATE_LABELS = {
  draft: 'Draft',
  'awaiting-review': 'Awaiting review',
  published: 'Published'
}

// Checkboxes with the same name submit as a single string (one checked) or
// an array (several checked) — req.query.state is undefined with none.
function toArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) return [value]
  return []
}

function readSlug(value, fallback) {
  return typeof value === 'string' && value ? value : fallback
}

// Builds a /2026-09-24-context-pane/hub?... href carrying every currently-applied filter
// except the overrides given — used for both "this facet's own href when
// nothing has changed yet" (not needed) and, more importantly, each
// selected-filter tag's "remove just this one" link and Clear filters.
// Omits a param entirely when it's at its default, so an unfiltered visit
// stays a bare /2026-09-24-context-pane/hub rather than growing empty querystring cruft.
function buildHref({ q, category, scheme, year, states, sort }) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category !== 'all') params.set('category', category)
  if (scheme !== 'all') params.set('scheme', scheme)
  if (year !== 'all') params.set('year', year)
  states.forEach((state) => params.append('state', state))
  if (sort !== 'most-relevant') params.set('sort', sort)

  const query = params.toString()
  return query
    ? `/2026-09-24-context-pane/hub?${query}`
    : '/2026-09-24-context-pane/hub'
}

// The hub is now the single all-guidance list: what used to be the
// separate /2026-09-24-context-pane/hub/search page (its own Category/State/Scheme/
// Year/Version filters and results — buildManageGuidanceSearchResults(),
// unchanged) is rendered straight onto the hub, replacing the four tabs
// (Recently opened, Saved guidance, Editing, Awaiting approval) that used
// to be the only place those lists showed — they're in the context pane
// now instead (app/data/context-pane.js). See hub/search/routes.js (now
// just a redirect here, for old links/bookmarks) and page.notes.md.
//
// Filtering/sorting is a real querystring round-trip (category/scheme/
// year/state/sort/q), not client-side JS, so the page works with
// JavaScript off — see page.notes.md for why that changed.
function fromSession(req) {
  const q = (req.query.q || '').trim()
  addRecentSearch(req, q)

  const category = readSlug(req.query.category, 'all')
  const scheme = readSlug(req.query.scheme, 'all')
  const year = readSlug(req.query.year, 'all')
  const states = toArray(req.query.state)
  const sort = readSlug(req.query.sort, 'most-relevant')

  const allResults = buildManageGuidanceSearchResults(
    req,
    '/2026-09-24-context-pane/document'
  ).map((document) => ({
    ...document,
    // buildManageGuidanceSearchResults() always joins its overviewHrefBase
    // with a ?id= query string — the v6 manage-guidance/document-overview
    // convention. Playground's own document page is /2026-09-24-context-pane/document/:id
    // instead, so this rebuilds the href in that shape rather than passing
    // it straight through.
    overviewHref: `/2026-09-24-context-pane/document/${document.id}`
  }))

  const searchText = q.toLowerCase()
  const stateLabels = states.map((value) => STATE_LABELS[value])

  let results = allResults.filter((document) => {
    if (category !== 'all' && document.category !== CATEGORY_LABELS[category]) {
      return false
    }
    if (scheme !== 'all' && document.scheme !== SCHEME_LABELS[scheme]) {
      return false
    }
    if (year !== 'all' && String(document.year) !== year) {
      return false
    }
    if (stateLabels.length && stateLabels.indexOf(document.state) === -1) {
      return false
    }
    if (searchText) {
      const haystack = `${document.title} ${document.description}`.toLowerCase()
      if (haystack.indexOf(searchText) === -1) return false
    }
    return true
  })

  if (sort === 'updated-newest') {
    results = results
      .slice()
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
  } else if (sort === 'updated-oldest') {
    results = results
      .slice()
      .sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated))
  }
  // "Most relevant" — no real relevance ranking to apply, so results keep
  // buildManageGuidanceSearchResults()' own order.

  const current = { q, category, scheme, year, states, sort }
  const selectedFilters = []

  if (category !== 'all') {
    selectedFilters.push({
      label: CATEGORY_LABELS[category],
      href: buildHref({ ...current, category: 'all' })
    })
  }
  if (scheme !== 'all') {
    selectedFilters.push({
      label: SCHEME_LABELS[scheme],
      href: buildHref({ ...current, scheme: 'all' })
    })
  }
  if (year !== 'all') {
    selectedFilters.push({
      label: year,
      href: buildHref({ ...current, year: 'all' })
    })
  }
  states.forEach((value) => {
    selectedFilters.push({
      label: STATE_LABELS[value],
      href: buildHref({
        ...current,
        states: states.filter((state) => state !== value)
      })
    })
  })

  return {
    initialSearchQuery: q,
    selectedCategory: category,
    selectedScheme: scheme,
    selectedYear: year,
    stateChecked: {
      draft: states.indexOf('draft') !== -1,
      'awaiting-review': states.indexOf('awaiting-review') !== -1,
      published: states.indexOf('published') !== -1
    },
    selectedSort: sort,
    selectedFilters,
    clearFiltersHref: '/2026-09-24-context-pane/hub',
    results,
    contextPane: buildContextPane(req, {
      returnHref: '/2026-09-24-context-pane/hub',
      searchQuery: q
    })
  }
}

module.exports = { fromSession }
