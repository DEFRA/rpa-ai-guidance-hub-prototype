//
// The persistent context pane (app/views/partials/context-pane.njk) —
// shown on every page that has a document in view or a set of personal
// lists to show (the hub, the document overview page, both guidance
// viewers, the editor). Same section structure for both roles; content
// varies by role. Replaces the hub's four tabs (Recently opened, Saved
// guidance, Editing, Awaiting approval), which used to be the only place
// any of this showed.
//
// Not part of any journey being prototyped — this is the research/
// navigation-redesign feature itself. See each touched page's own
// page.notes.md for why.
//

const { guidanceDocuments } = require('./guidance-documents')
const guidanceLists = require('./guidance-lists')
const manageGuidance = require('./manage-guidance')

const DEFAULT_ROLE = 'viewer'

// The three hub lists a document can still be removed from — the same
// ?tab= values the retired hub tabs used, kept as the identifier
// remove-confirm/remove pass around (see hub/remove/controller.js) even
// though there is no literal tab to return to any more.
const REMOVABLE_LISTS = ['recently-opened', 'saved-guidance', 'editing']
const LIST_NAMES = {
  'recently-opened': 'Recently opened',
  'saved-guidance': 'Saved guidance',
  editing: 'Editing'
}

const RECENT_SEARCHES_LIMIT = 5
const LIST_ITEM_LIMIT = 5

function getRole(req) {
  return req.session.data.role === 'designer' ? 'designer' : DEFAULT_ROLE
}

function setRole(req, role) {
  req.session.data.role = role === 'designer' ? 'designer' : DEFAULT_ROLE
}

// Whether the pane is collapsed — session-backed, not client-side
// (localStorage/JS), so the pane's own Hide/Show controls are real
// <form method="post"> round-trips (see context-pane-toggle/routes.js)
// that work with JavaScript off: the server already knows which way to
// render before the page loads, rather than rendering one state and
// asking a script to flip it. One flag shared across every page, not
// per-page-type — simpler to reason about than per-page memory, and "I'd
// rather not see this right now" is a reasonable single preference.
// defaultCollapsed (the editor only, so far) applies until a visitor
// actually touches the control anywhere, at which point their own choice
// takes over everywhere.
function getPaneCollapsed(req, defaultCollapsed) {
  const stored = req.session.data.contextPaneCollapsed
  return typeof stored === 'boolean' ? stored : Boolean(defaultCollapsed)
}

function setPaneCollapsed(req, collapsed) {
  req.session.data.contextPaneCollapsed = Boolean(collapsed)
}

function getRecentSearches(req) {
  if (!req.session.data.recentSearches) {
    req.session.data.recentSearches = []
  }
  return req.session.data.recentSearches
}

// Called on every hub visit (see hub/view-model.js) — a no-op for an
// empty query, so landing on the hub with nothing typed yet doesn't add a
// blank entry.
function addRecentSearch(req, query) {
  const trimmed = (query || '').trim()
  if (!trimmed) return

  const list = getRecentSearches(req)
  const existingIndex = list.findIndex(
    (entry) => entry.toLowerCase() === trimmed.toLowerCase()
  )
  if (existingIndex !== -1) list.splice(existingIndex, 1)
  list.unshift(trimmed)
  if (list.length > RECENT_SEARCHES_LIMIT) list.length = RECENT_SEARCHES_LIMIT
}

function docHref(id) {
  return `/playground/document/${id}`
}

// A body can be a string (one paragraph), an array (a bullet list) or, for
// a nested-steps document, absent at this level in favour of section.parts
// — see buildTraditionalSections in document/view/traditional/controller.js
// for the same three shapes. Markers are collected from whichever a given
// document actually has.
const LINK_MARKER_PATTERN = /{{LINK:([^}]+)}}/g

function collectMarkersFromBody(body, markers) {
  if (!body) return
  body.forEach((entry) => {
    if (typeof entry === 'string') {
      let match
      LINK_MARKER_PATTERN.lastIndex = 0
      while ((match = LINK_MARKER_PATTERN.exec(entry)) !== null) {
        markers.add(match[1].trim())
      }
    } else if (Array.isArray(entry)) {
      collectMarkersFromBody(entry, markers)
    }
  })
}

function extractLinkMarkers(rawDocument) {
  const markers = new Set()
  if (!rawDocument || !rawDocument.steps) return markers

  rawDocument.steps.forEach((step) => {
    if (step.parts) {
      step.parts.forEach((part) => collectMarkersFromBody(part.body, markers))
    } else {
      collectMarkersFromBody(step.body, markers)
    }
  })
  return markers
}

// A marker is free text (e.g. "CRM Advanced Find") describing guidance
// that mostly doesn't exist as a real page yet — see the renderLinkMarkers
// filter (app/filters.js) this same convention already uses for the body
// text itself. Only markers that happen to match a real document's title
// exactly (case-insensitive) become a link here; the rest render as plain
// text in the pane, same as they already do inline in the document body.
function findDocumentByTitle(title) {
  const lower = title.trim().toLowerCase()
  return guidanceDocuments.find((doc) => doc.title.toLowerCase() === lower)
}

function buildReferencedIn(rawDocument) {
  return Array.from(extractLinkMarkers(rawDocument)).map((markerText) => {
    const match = findDocumentByTitle(markerText)
    return { title: markerText, href: match ? docHref(match.id) : null }
  })
}

// The reverse of buildReferencedIn — every other document whose own body
// carries a marker matching this document's title, so a designer editing
// it can see what would be affected. Re-scans every document's markers on
// each call rather than caching a reverse index — cheap at this dataset's
// size (a couple of dozen documents), and never called on a page with more
// than one document to build it for.
function buildLinkedFrom(guidanceDocument) {
  if (!guidanceDocument) return []
  const targetTitle = guidanceDocument.title.toLowerCase()

  return guidanceDocuments
    .filter((doc) => doc.id !== guidanceDocument.id)
    .filter((doc) =>
      Array.from(extractLinkMarkers(doc)).some(
        (marker) => marker.toLowerCase() === targetTitle
      )
    )
    .map((doc) => ({ title: doc.title, href: docHref(doc.id) }))
}

function buildRelatedGuidance(guidanceDocument) {
  if (!guidanceDocument || !guidanceDocument.scheme) return []
  return guidanceDocuments
    .filter(
      (doc) =>
        doc.id !== guidanceDocument.id && doc.scheme === guidanceDocument.scheme
    )
    .slice(0, LIST_ITEM_LIMIT)
    .map((doc) => ({ title: doc.title, href: docHref(doc.id) }))
}

// Looks a document up the same way documentOverviewViewModel
// (document/view-model.js) does — Editing, then Awaiting approval, then
// the manage-guidance-only Published samples, then plain
// guidanceDocuments — but returns the pane's own flatter shape rather than
// that page's, since the two pages need different fields (this adds
// publishingChecks/changesRequested/the raw document for link markers;
// it has no use for versionsJson or a defaultVersionKey).
function resolveDocument(req, id) {
  if (!id) return null

  const full = manageGuidance.lookupAnyManageGuidanceDocument(id)
  if (!full) return null

  const { editingDocuments, awaitingApprovalDocuments } =
    manageGuidance.buildManageGuidanceRows(req)
  const editingMatch = editingDocuments.find((doc) => doc.id === id)
  const awaitingMatch = awaitingApprovalDocuments.find((doc) => doc.id === id)
  const row = editingMatch || awaitingMatch

  return {
    id: full.id,
    title: full.title,
    scheme: full.scheme,
    version: row ? row.version : full.version,
    versions: full.versions,
    status: editingMatch
      ? 'Draft'
      : awaitingMatch
        ? 'Awaiting approval'
        : 'Published',
    publishingChecks: row ? row.publishingChecks : 0,
    changesRequested: row ? row.changesRequested : 0,
    raw: full
  }
}

// A guidance viewer's own table of contents, folded into the pane as its
// own accordion section rather than a separate column — see
// document/view/traditional/controller.js, the only caller that passes
// toc (its own contents nav was a simple in-page anchor list to begin
// with, so folding it in loses nothing). The stepper viewer's own
// sidebar is deliberately NOT folded in the same way — it also carries a
// Case notes tab and an in-document search, both stateful tools rather
// than passive context, so it keeps its own column. See both viewers'
// own page.notes.md.
function buildContentsSection(toc) {
  if (!toc || !toc.length) return null
  return { id: 'contents', heading: 'Contents', items: toc }
}

function buildThisDocumentSection(doc, role) {
  const facts = [{ label: 'Status', value: doc.status }]
  if (doc.scheme) facts.push({ label: 'Scheme', value: doc.scheme })

  if (role === 'designer') {
    facts.push({
      label: 'Publishing checks',
      value:
        doc.publishingChecks === 0
          ? 'No issues'
          : `${doc.publishingChecks} issue${doc.publishingChecks !== 1 ? 's' : ''}`
    })
    facts.push({
      label: 'Changes requested',
      value:
        doc.changesRequested === 0
          ? 'None'
          : `${doc.changesRequested} change${doc.changesRequested !== 1 ? 's' : ''} requested`
    })
  }

  // "Newer version exists" — version2 existing but not being the document's
  // current version (doc.version) covers both an older document that has
  // since had a v2 drafted, and a document whose "current" is deliberately
  // still v1 — see MANAGE_GUIDANCE_PUBLISHED_SAMPLES' own top comment in
  // app/data/manage-guidance.js for why that split is real data, not a bug.
  const newerVersion =
    doc.versions &&
    doc.versions.version2 &&
    doc.version !== doc.versions.version2.label
      ? doc.versions.version2
      : null

  return {
    id: 'this-document',
    heading: 'This document',
    facts,
    warning: newerVersion
      ? {
          text: `A newer version (${newerVersion.label}) exists`,
          notes: newerVersion.versionNotes
        }
      : null
  }
}

function buildRelationshipsSection(doc, role) {
  const related = buildRelatedGuidance(doc)
  const referencedIn = role === 'designer' ? [] : buildReferencedIn(doc.raw)
  const linkedFrom = role === 'designer' ? buildLinkedFrom(doc.raw) : []

  if (!related.length && !referencedIn.length && !linkedFrom.length) return null

  return {
    id: 'relationships',
    heading: 'Related guidance',
    related,
    referencedIn,
    linkedFrom
  }
}

function buildList(id, heading, rows, removableListId, returnHref, metaFn) {
  const items = rows.slice(0, LIST_ITEM_LIMIT).map((row) => ({
    id: row.id,
    title: row.title || row.name,
    href: docHref(row.id),
    updated: Boolean(row.updated),
    meta: metaFn ? metaFn(row) : row.lastModified,
    removeHref: removableListId
      ? `/playground/hub/remove-confirm?id=${encodeURIComponent(row.id)}&tab=${removableListId}&returnTo=${encodeURIComponent(returnHref)}`
      : null
  }))
  return { id, heading, items, total: rows.length }
}

// Recently opened, with an "Updated since you opened it" flag — compares
// the version recorded at the moment it was opened (guidance-lists.js'
// own addRecentlyOpened, extended to store it) against the document's
// current version. A pre-existing seeded entry (or one from before that
// change) has no stored version, so it never flags — safer than assuming
// "updated" for data with nothing to compare against.
function buildRecentlyOpenedRows(req) {
  return guidanceLists.getRecentlyOpened(req).reduce((rows, entry) => {
    const doc = guidanceDocuments.find((candidate) => candidate.id === entry.id)
    if (!doc) return rows
    rows.push({
      id: doc.id,
      title: doc.title,
      lastModified: entry.lastModified,
      updated: Boolean(entry.version) && entry.version !== doc.version
    })
    return rows
  }, [])
}

function needsAttentionMeta(row) {
  if (row.changesRequested > 0) {
    return `${row.changesRequested} change${row.changesRequested !== 1 ? 's' : ''} requested`
  }
  return `${row.publishingChecks} issue${row.publishingChecks !== 1 ? 's' : ''}`
}

// Each of the reader's own lists (Recently opened, Saved guidance,
// Editing, Awaiting approval, Needs your attention) is its own accordion
// section now, not grouped under one "Your lists" panel — per user
// feedback, so a reader can open just the one they actually want rather
// than getting all of them (or none of them) together.
function buildYourListsSections(req, role, returnHref) {
  const lists = []

  if (role === 'designer') {
    const { editingDocuments, awaitingApprovalDocuments } =
      manageGuidance.buildManageGuidanceRows(req)
    const needsAttention = editingDocuments.filter(
      (doc) => doc.changesRequested > 0 || doc.publishingChecks > 0
    )

    lists.push(
      buildList(
        'needs-attention',
        'Needs your attention',
        needsAttention,
        null,
        returnHref,
        needsAttentionMeta
      )
    )
    lists.push(
      buildList('editing', 'Editing', editingDocuments, 'editing', returnHref)
    )
    lists.push(
      buildList(
        'awaiting-approval',
        'Awaiting approval',
        awaitingApprovalDocuments,
        null,
        returnHref
      )
    )
    lists.push(
      buildList(
        'recently-opened',
        'Recently opened',
        buildRecentlyOpenedRows(req),
        'recently-opened',
        returnHref
      )
    )
  } else {
    lists.push(
      buildList(
        'recently-opened',
        'Recently opened',
        buildRecentlyOpenedRows(req),
        'recently-opened',
        returnHref
      )
    )
    lists.push(
      buildList(
        'saved-guidance',
        'Saved guidance',
        guidanceLists.buildFindGuidanceRows(
          guidanceLists.getPinnedGuidance(req)
        ),
        'saved-guidance',
        returnHref
      )
    )
  }

  return lists.filter((list) => list.items.length)
}

// "Result 3 of 12 for 'moorland'" plus Previous/Next — only built when a
// document was actually reached from a hub search (?from=search&q=…, see
// document/view-model.js and the viewer controllers), using the same
// dataset and the same plain title/description substring match the hub's
// own client-side filtering already does (app/views/playground/hub/page.njk).
function buildSearchResultContext(req, documentId, query) {
  const trimmed = (query || '').trim().toLowerCase()
  const allResults = manageGuidance.buildManageGuidanceSearchResults(req, '')

  const filtered = trimmed
    ? allResults.filter((doc) =>
        `${doc.title} ${doc.description}`.toLowerCase().includes(trimmed)
      )
    : allResults

  const index = filtered.findIndex((doc) => doc.id === documentId)
  if (index === -1) return null

  const hrefFor = (doc) =>
    `${docHref(doc.id)}?from=search&q=${encodeURIComponent(query || '')}`

  return {
    position: index + 1,
    total: filtered.length,
    query,
    prevHref: index > 0 ? hrefFor(filtered[index - 1]) : null,
    nextHref: index < filtered.length - 1 ? hrefFor(filtered[index + 1]) : null,
    backHref: `/playground/hub?q=${encodeURIComponent(query || '')}`
  }
}

// options:
//   documentId       — the document this page is showing, if any
//   returnHref       — where "Remove"/"Switch role"/the Hide-Show form
//                       should come back to
//   searchQuery      — present (even as '') only when this page was
//                       reached via ?from=search, so the search-result
//                       section only shows there, not on every document
//                       page
//   toc              — [{ text, href }], a viewer's own contents list
//                       (see buildContentsSection above) — only the
//                       traditional viewer passes this
//   defaultCollapsed — whether the pane starts collapsed before anyone's
//                       ever touched the control (see getPaneCollapsed) —
//                       only the editor passes true
//
// Every section renders as one govukAccordion item (see
// partials/context-pane.njk) rather than a fixed always-open block, so a
// page with several sections doesn't force all of them on the reader at
// once — including each of the reader's own lists, now that
// buildYourListsSections gives each one its own section rather than one
// shared "Your lists" panel. Exactly one section starts expanded — "the
// main info for that page": Contents when there is one (a viewer,
// mid-read), else This document (a document is in view but reading it
// isn't the immediate task), else whichever list is most likely to be
// why a reader with no document open came here (Needs your attention for
// a designer, Recently opened for a viewer) — falling back to the first
// section there is one of, if that preferred one happens to be empty and
// so isn't in the list at all. The rest start collapsed, one click away.
function buildContextPane(req, options) {
  const opts = options || {}
  const role = getRole(req)
  const returnHref = opts.returnHref || '/playground/hub'
  const resolved = opts.documentId
    ? resolveDocument(req, opts.documentId)
    : null

  const sections = []
  const contents = buildContentsSection(opts.toc)
  if (contents) sections.push(contents)
  if (resolved) {
    sections.push(buildThisDocumentSection(resolved, role))
    const relationships = buildRelationshipsSection(resolved, role)
    if (relationships) sections.push(relationships)
  }
  sections.push(...buildYourListsSections(req, role, returnHref))

  const filteredSections = sections.filter(Boolean)
  const preferredOpenId = contents
    ? 'contents'
    : resolved
      ? 'this-document'
      : role === 'designer'
        ? 'needs-attention'
        : 'recently-opened'
  const defaultOpenId = filteredSections.some(
    (section) => section.id === preferredOpenId
  )
    ? preferredOpenId
    : filteredSections.length
      ? filteredSections[0].id
      : null
  filteredSections.forEach((section) => {
    section.expanded = section.id === defaultOpenId
  })

  const searchContext =
    resolved && typeof opts.searchQuery === 'string'
      ? buildSearchResultContext(req, opts.documentId, opts.searchQuery)
      : null

  return {
    role,
    returnHref,
    collapsed: getPaneCollapsed(req, opts.defaultCollapsed),
    switchRoleHref: '/playground/switch-role',
    toggleHref: '/playground/context-pane-toggle',
    recentSearches: getRecentSearches(req),
    searchContext,
    sections: filteredSections
  }
}

module.exports = {
  REMOVABLE_LISTS,
  LIST_NAMES,
  getRole,
  setRole,
  getPaneCollapsed,
  setPaneCollapsed,
  getRecentSearches,
  addRecentSearch,
  buildContextPane
}
