const lifecycle = require('../../../data/guide-lifecycle')
const guideAliases = require('../../../data/guide-aliases')
const { isDesigner } = require('../../../data/permissions')
const {
  getPlaygroundApiGuides
} = require('../../../data/playground-api-guides')
const {
  getListIds,
  getQuickFilters,
  findBookmark,
  readBookmarkFilter,
  isPinned,
  sectionHref,
  LISTS,
  BOOKMARK_TYPES
} = require('../../../data/side-nav')
const { getGuidePosition } = require('../../../data/guide-positions')
const { audiencesOf } = require('../../../data/guide-audiences')
const { systemsOf } = require('../../../data/guide-systems')
const { searchGuidance } = require('../../../lib/guidance-api-client')
const { GUIDANCE_API_CONFIGURED } = require('../../../lib/feature-flags')
const { isDottedNumber } = require('../../../lib/section-numbers')
const { isQuestion } = require('../../../assets/javascripts/query-kind')
const { searchEveryGuide } = require('./keyword-search')
const { getGuideMetadata } = require('../guide/guide-metadata')

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
// 'published' is the old slug for Live, kept so old links still filter.
const STATE_LABELS = {
  draft: lifecycle.DRAFT_LABELS.draft,
  'awaiting-review': lifecycle.DRAFT_LABELS['awaiting-review'],
  live: lifecycle.LIVE_LABEL,
  published: lifecycle.LIVE_LABEL
}

// The checkbox facets of the hub's Filter results column. Who it's for and
// System used filter on each guide's audiences and systems
// (data/guide-audiences.js, data/guide-systems.js), and Scheme year on each
// guide's year, and count them across every guide. D365 has no guides yet,
// so its count is made up and it narrows nothing.
const AUDIENCES = [
  { value: 'processors', text: 'Processors', count: 28 },
  { value: 'team-leaders', text: 'Team leaders', count: 4 },
  { value: 'editors', text: 'Editors', count: 2 }
]
const SYSTEMS = [
  { value: 'crm', text: 'CRM', count: 19 },
  { value: 'siti-agri', text: 'SITI Agri', count: 12 },
  { value: 'd365', text: 'D365', count: 3 }
]
const YEARS = [
  { value: '2026', text: '2026', count: 21 },
  { value: '2025', text: '2025', count: 13 }
]

// A result's facet values as the filters label them (For, Systems).
function labelsOf(values, options) {
  return options
    .filter((option) => values.indexOf(option.value) !== -1)
    .map((option) => option.text)
}

// The values of a checkbox facet that are among its options.
function readChecked(value, options) {
  return toArray(value).filter((checked) =>
    options.some((option) => option.value === checked)
  )
}

// A facet's checkboxes, ticked as the query asks.
function checkboxItems(options, checked) {
  return options.map((option) => ({
    value: option.value,
    html: `${option.text} <span class="app-hub-filters__count">(${option.count})</span>`,
    checked: checked.indexOf(option.value) !== -1
  }))
}

// Until something is searched for there is no relevance to sort by.
function defaultSort(q) {
  return q ? 'most-relevant' : 'updated-newest'
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
  years,
  audiences,
  systems,
  states,
  sort
}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (list) params.set('list', list)
  if (bookmark) params.set(BOOKMARK_TYPES[bookmark.type].param, bookmark.ref)
  if (category !== 'all') params.set('category', category)
  if (scheme !== 'all') params.set('scheme', scheme)
  audiences.forEach((audience) => params.append('audience', audience))
  systems.forEach((system) => params.append('system', system))
  years.forEach((year) => params.append('year', year))
  states.forEach((state) => params.append('state', state))
  if (sort !== defaultSort(q)) params.set('sort', sort)

  const query = params.toString()
  const path = query ? `/playground/hub?${query}` : '/playground/hub'
  return path + RESULTS_ANCHOR
}

// The API-mode equivalent of lifecycle.buildHubResults — an
// API-sourced guide (app/lib/guidance-api-loader.js) has no
// editing/awaiting-approval/published session state to branch on, so this
// is a plain map rather than that function's three-way merge. Produces
// the same row shape (id/title/description/version/lastUpdated/published/
// category/scheme/year/state/overviewHref) so every filter/sort/pin step
// below works unchanged regardless of which source built allResults.
// A designer's draft on an API guide, as a state label (viewers never see
// one): its own, or one started on a mock copy of it (guide-aliases.js).
function apiDraftLabels(req, document, designer) {
  if (!designer) return []
  const draft = [document.id, ...guideAliases.mockIdsOf(document.id)]
    .map((id) => lifecycle.getDraft(req, id))
    .find(Boolean)
  return draft ? [lifecycle.DRAFT_LABELS[draft.state]] : []
}

function buildApiSearchResults(req, documents, overviewHrefBase, designer) {
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
    versionTag: lifecycle.versionTag(
      parseInt(document.version.replace(/\D/g, ''), 10) || 1
    ),
    states: [lifecycle.LIVE_LABEL].concat(
      apiDraftLabels(req, document, designer)
    ),
    overviewHref: `${overviewHrefBase}/${encodeURIComponent(document.id)}`
  }))
}

// One AI search result as a link into the prototype's own copy of its guide.
// The API names guides by uuid; the playground by slug (apiId keeps the uuid).
function aiSearchLink(result, apiGuides) {
  const guide = apiGuides.find(
    (candidate) => candidate.apiId === result.documentId
  )
  const number = result.sectionNumber
  const guideHref = guide
    ? `/playground/guide/${encodeURIComponent(guide.id)}`
    : null

  return {
    text: number
      ? isDottedNumber(number)
        ? `${number} ${result.heading}`
        : result.heading
      : result.documentTitle,
    href:
      guideHref && number
        ? `${guideHref}/search-section/${encodeURIComponent(number)}`
        : guideHref,
    documentTitle: number ? result.documentTitle : null,
    reason: result.reason
  }
}

// The API's AI search, shaped for the page: its summary with the results it
// was drawn from, then every result. Null when nothing was searched or the
// API has no search to offer, so the page shows only the guide list.
function buildAiSearch(search, apiGuides) {
  if (!search) return null
  return {
    query: search.query,
    answer: search.answer
      ? {
          text: search.answer.answer,
          cited: search.answer.cited.map((result) =>
            aiSearchLink(result, apiGuides)
          )
        }
      : null,
    results: search.results.map((result) => aiSearchLink(result, apiGuides))
  }
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
// case bookmark). Pinned guides
// have no filter of their own — they carry a star and sit at the top of the
// list whenever nothing narrows it.
//
// Filtering/sorting is a real querystring round-trip (category/scheme/
// year/state/sort/q), not client-side JS, so the page works with
// JavaScript off — see page.notes.md for why that changed.
async function fromSession(req) {
  const q = (req.query.q || '').trim()
  // A question goes to the AI search, alongside the guide list rather than
  // after it; other words are counted in every API guide, which needs the list.
  const question = q && GUIDANCE_API_CONFIGURED && isQuestion(q)
  const [apiGuides, search] = await Promise.all([
    getPlaygroundApiGuides(req),
    question ? searchGuidance(q) : null
  ])
  const keywordSearch =
    q && GUIDANCE_API_CONFIGURED && !question
      ? await searchEveryGuide(q, apiGuides)
      : null

  const category = readSlug(req.query.category, 'all')
  const scheme = readSlug(req.query.scheme, 'all')
  const years = readChecked(req.query.year, YEARS)
  const audiences = readChecked(req.query.audience, AUDIENCES)
  const systems = readChecked(req.query.system, SYSTEMS)
  // Only designers can see (and so filter by) non-Live guides.
  const designer = isDesigner(req)
  const states = designer
    ? toArray(req.query.state).filter((value) => STATE_LABELS[value])
    : []
  const sort = readSlug(req.query.sort, defaultSort(q))

  const bookmark = readBookmarkFilter(req.query)
  const knownBookmark = Boolean(
    bookmark && findBookmark(req, bookmark.type, bookmark.ref)
  )
  // The lists ?list= can name: the side nav's own.
  const quickFilters = getQuickFilters(req, '/playground')
  const requestedList = readSlug(req.query.list, '')
  const list =
    !bookmark && quickFilters.some((filter) => filter.id === requestedList)
      ? requestedList
      : ''
  const listIds = bookmark || list ? getListIds(req, list, bookmark) : null

  // The API's guides, fetched fresh on this request, are added to the mock
  // manage-guidance rows rather than replacing them, so the mock journeys
  // keep working whether or not the API has any guides. Their ids are the
  // API's uuids, so they never collide with a mock guide's.
  const baseResults = [
    ...buildApiSearchResults(req, apiGuides, '/playground/guide', designer),
    ...lifecycle
      .buildHubResults(req, { includeNonLive: designer })
      // A mock copy of a real guide is listed as the real guide only.
      .filter((document) => !guideAliases.isReplacedMock(req, document.id))
      .map((document) => ({
        ...document,
        overviewHref: `/playground/guide/${document.id}`
      }))
  ]
  const allResults = baseResults.map((document) => {
    // In the Recently opened list, a guide the reader has scrolled through
    // opens where they left off (guide-positions.js, via guide/section/).
    const position =
      list === 'recently-opened' ? getGuidePosition(req, document.id) : null
    return {
      ...document,
      overviewHref: position
        ? sectionHref('/playground', document.id, position.anchor)
        : document.overviewHref,
      resumeLabel: position ? position.label : null,
      pinned: isPinned(req, document.id),
      audiences: audiencesOf(document.id),
      systems: systemsOf(document.id),
      audienceLabels: labelsOf(audiencesOf(document.id), AUDIENCES),
      systemLabels: labelsOf(systemsOf(document.id), SYSTEMS),
      metadata: getGuideMetadata(document.id)
    }
  })

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
    if (
      audiences.length &&
      !document.audiences.some((audience) => audiences.indexOf(audience) !== -1)
    ) {
      return false
    }
    const knownSystems = systems.filter((system) => system !== 'd365')
    if (
      knownSystems.length &&
      !document.systems.some((system) => knownSystems.indexOf(system) !== -1)
    ) {
      return false
    }
    if (years.length && years.indexOf(String(document.year)) === -1) {
      return false
    }
    if (
      stateLabels.length &&
      !document.states.some((state) => stateLabels.indexOf(state) !== -1)
    ) {
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
    !years.length &&
    !audiences.length &&
    !systems.length &&
    !states.length
  if (unfiltered) {
    results = results
      .filter((document) => document.pinned)
      .concat(results.filter((document) => !document.pinned))
  }

  const current = {
    q,
    list,
    bookmark,
    category,
    scheme,
    years,
    audiences,
    systems,
    states,
    sort
  }
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
  const facets = [
    { key: 'audiences', values: audiences, options: AUDIENCES },
    { key: 'systems', values: systems, options: SYSTEMS },
    { key: 'years', values: years, options: YEARS }
  ]
  facets.forEach(({ key, values, options }) => {
    values.forEach((value) => {
      selectedFilters.push({
        label: options.find((option) => option.value === value).text,
        href: buildHref({
          ...current,
          [key]: values.filter((other) => other !== value)
        })
      })
    })
  })
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
    aiSearch: buildAiSearch(search, apiGuides),
    keywordSearch,
    aiSearchAvailable: GUIDANCE_API_CONFIGURED,
    selectedList: list,
    selectedBookmark: bookmark
      ? { param: BOOKMARK_TYPES[bookmark.type].param, ref: bookmark.ref }
      : null,
    currentHref: buildHref(current),
    selectedCategory: category,
    selectedScheme: scheme,
    audienceItems: checkboxItems(
      AUDIENCES.map((option) => ({
        ...option,
        count: allResults.filter(
          (document) => document.audiences.indexOf(option.value) !== -1
        ).length
      })),
      audiences
    ),
    systemItems: checkboxItems(
      SYSTEMS.map((option) =>
        option.value === 'd365'
          ? option
          : {
              ...option,
              count: allResults.filter(
                (document) => document.systems.indexOf(option.value) !== -1
              ).length
            }
      ),
      systems
    ),
    yearItems: checkboxItems(
      YEARS.map((option) => ({
        ...option,
        count: allResults.filter(
          (document) => String(document.year) === option.value
        ).length
      })),
      years
    ),
    isDesigner: designer,
    stateChecked: {
      draft: states.indexOf('draft') !== -1,
      'awaiting-review': states.indexOf('awaiting-review') !== -1,
      live: states.some((value) => STATE_LABELS[value] === lifecycle.LIVE_LABEL)
    },
    selectedSort: sort,
    selectedFilters,
    clearFiltersHref: '/playground/hub' + RESULTS_ANCHOR,
    results,
    pinToggleHref: '/playground/pin-toggle'
  }
}

module.exports = { fromSession }
