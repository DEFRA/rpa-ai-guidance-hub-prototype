const {
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')
const { getGuidanceDocuments } = require('../../../data/guidance-documents')
const { GUIDANCE_API_ENABLED } = require('../../../lib/feature-flags')
const {
  getListIds,
  getQuickFilters,
  findBookmark,
  readBookmarkFilter,
  isPinned,
  LISTS,
  BOOKMARK_TYPES
} = require('../../../data/side-nav')

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

// Every filter link/redirect lands on the results table, not the top of the
// page, so the reader doesn't scroll back down past the hero each time.
const RESULTS_ANCHOR = '#guide-results'

// Builds a /playground/hub?... href carrying every currently-applied filter
// except the overrides given — used for both "this facet's own href when
// nothing has changed yet" (not needed) and, more importantly, each
// selected-filter tag's "remove just this one" link and Clear filters.
// Omits a param entirely when it's at its default, so an unfiltered visit
// stays a bare /playground/hub rather than growing empty querystring cruft.
function buildHref({
  q,
  list,
  bookmark,
  category,
  scheme,
  year,
  states,
  sort
}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (list) params.set('list', list)
  if (bookmark) params.set(BOOKMARK_TYPES[bookmark.type].param, bookmark.ref)
  if (category !== 'all') params.set('category', category)
  if (scheme !== 'all') params.set('scheme', scheme)
  if (year !== 'all') params.set('year', year)
  states.forEach((state) => params.append('state', state))
  if (sort !== 'most-relevant') params.set('sort', sort)

  const query = params.toString()
  const path = query ? `/playground/hub?${query}` : '/playground/hub'
  return path + RESULTS_ANCHOR
}

// The API-mode equivalent of buildManageGuidanceSearchResults — an
// API-sourced guide (app/lib/guidance-api-loader.js) has no
// editing/awaiting-approval/published session state to branch on, so this
// is a plain map rather than that function's three-way merge. Produces
// the same row shape (id/title/description/version/lastUpdated/published/
// category/scheme/year/state/overviewHref) so every filter/sort/pin step
// below works unchanged regardless of which source built allResults.
function buildApiSearchResults(documents, overviewHrefBase) {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    description: document.description,
    version: document.version,
    lastUpdated: document.lastUpdated,
    published: document.published,
    category: document.category,
    scheme: document.scheme,
    year: document.year,
    state: 'Published',
    overviewHref: `${overviewHrefBase}/${encodeURIComponent(document.id)}`
  }))
}

// The hub is now the single all-guidance list: what used to be the
// separate /playground/hub/search page (its own Category/State/Scheme/
// Year/Version filters and results — buildManageGuidanceSearchResults(),
// unchanged) is rendered straight onto the hub, replacing the four tabs
// (Recently opened, Saved guidance, Editing, Awaiting approval) that used
// to be the only place those lists showed — they're in the context pane
// now instead — now the side navigation (app/data/side-nav.js). See
// hub/search/routes.js (now just a redirect here, for old links/bookmarks)
// and page.notes.md.
//
// The side nav's lists are filters of this one list: ?list= (Recently
// opened, Saved, Bookmarked guides, Awaiting my review) or ?case=/?sbi= (one
// case bookmark), mirrored by the quick-filter row above Filters. Pinned guides
// have no filter of their own — they carry a star and sit at the top of the
// list whenever nothing narrows it.
//
// Filtering/sorting is a real querystring round-trip (category/scheme/
// year/state/sort/q), not client-side JS, so the page works with
// JavaScript off — see page.notes.md for why that changed.
async function fromSession(req) {
  const q = (req.query.q || '').trim()

  const category = readSlug(req.query.category, 'all')
  const scheme = readSlug(req.query.scheme, 'all')
  const year = readSlug(req.query.year, 'all')
  const states = toArray(req.query.state)
  const sort = readSlug(req.query.sort, 'most-relevant')

  const bookmark = readBookmarkFilter(req.query)
  const knownBookmark = Boolean(
    bookmark && findBookmark(req, bookmark.type, bookmark.ref)
  )
  const quickFilters = getQuickFilters(req, '/playground')
  const requestedList = readSlug(req.query.list, '')
  const list =
    !bookmark && quickFilters.some((filter) => filter.id === requestedList)
      ? requestedList
      : ''
  const listIds = bookmark || list ? getListIds(req, list, bookmark) : null

  // GUIDANCE_API_ENABLED swaps the whole list's source, not just adds to
  // it (per the earlier design decision — the mock manage-guidance rows
  // and a live API guide can't be merged meaningfully, since the API has
  // no editing/awaiting-approval state of its own): a live manifest fetch
  // via getGuidanceDocuments(), fetched fresh on this request, in place of
  // buildManageGuidanceSearchResults' mock editing/awaiting/published
  // rows. See app/data/guidance-documents/index.js for the API-call/
  // fallback-to-mock logic itself.
  const documents = await getGuidanceDocuments()
  const baseResults = GUIDANCE_API_ENABLED
    ? buildApiSearchResults(documents, '/playground/guide')
    : buildManageGuidanceSearchResults(req, '/playground/document').map(
        (document) => ({
          ...document,
          // buildManageGuidanceSearchResults() always joins its
          // overviewHrefBase with a ?id= query string — the v6
          // manage-guidance/document-overview convention. The hub links
          // straight to the merged guide page (playground/guide/**)
          // instead — one click from here to the guide itself, rather
          // than through the old document overview/format-choice pages
          // first.
          overviewHref: `/playground/guide/${document.id}`
        })
      )
  const allResults = baseResults.map((document) => ({
    ...document,
    pinned: isPinned(req, document.id)
  }))

  const searchText = q.toLowerCase()
  const stateLabels = states.map((value) => STATE_LABELS[value])

  let results = allResults.filter((document) => {
    if (listIds && listIds.indexOf(document.id) === -1) return false
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

  const unfiltered =
    !q &&
    !listIds &&
    category === 'all' &&
    scheme === 'all' &&
    year === 'all' &&
    !states.length
  if (unfiltered) {
    results = results
      .filter((document) => document.pinned)
      .concat(results.filter((document) => !document.pinned))
  }

  const current = { q, list, bookmark, category, scheme, year, states, sort }
  const selectedFilters = []

  if (list) {
    selectedFilters.push({
      label: LISTS[list].text,
      href: buildHref({ ...current, list: '' })
    })
  }
  if (bookmark) {
    selectedFilters.push({
      label: `${BOOKMARK_TYPES[bookmark.type].short}: ${bookmark.ref}${
        knownBookmark ? '' : ' (not bookmarked)'
      }`,
      href: buildHref({ ...current, bookmark: null })
    })
  }

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
    selectedList: list,
    selectedBookmark: bookmark
      ? { param: BOOKMARK_TYPES[bookmark.type].param, ref: bookmark.ref }
      : null,
    quickFilters: quickFilters.map((filter) => {
      const selected = filter.id === list
      return {
        ...filter,
        selected,
        href: buildHref({
          ...current,
          list: selected ? '' : filter.id,
          bookmark: null
        })
      }
    }),
    currentHref: buildHref(current),
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
    clearFiltersHref: '/playground/hub' + RESULTS_ANCHOR,
    results,
    pinToggleHref: '/playground/pin-toggle'
  }
}

module.exports = { fromSession }
