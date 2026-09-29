//
// The persistent side navigation (app/views/partials/side-nav.njk and
// side-nav-rail.njk), set as res.locals.sideNav for every playground page
// by app/views/playground/routes.js. Replaces the context pane in
// playground — context-pane.js itself stays, since the frozen
// 2026-09-24-context-pane snapshot still renders it.
//
// The nav's lists (Recently opened, Saved, Bookmarked guides, Awaiting my
// review, a single case) are filters of the one hub list, not pages of
// their own: each links to <base>/hub?list=…, ?case=… or ?sbi=…, and
// getListIds() is what the hub's view model filters by.
//
// Case bookmarks are made on a guide's own page (buildBookmarkForm), not in
// the nav, keyed by a case ID or an SBI application number.
//
// `base` is the router's mount path — /playground, or a snapshot's own
// /<snapshot-id> once scripts/snapshot.js has copied the middleware — so a
// frozen copy's nav links to its own pages rather than live playground.
//

const { getRole, setRole } = require('./context-pane')
const guidanceLists = require('./guidance-lists')
const manageGuidance = require('./manage-guidance')

const DEFAULT_BASE = '/playground'

const ROLE_LABELS = {
  viewer: { role: 'Viewer' },
  designer: { role: 'Designer' }
}

const LISTS = {
  'recently-opened': { text: 'Recently opened', icon: 'clock' },
  pinned: { text: 'Pinned', icon: 'star' },
  bookmarked: { text: 'Bookmarked guides', icon: 'bookmark' },
  'awaiting-review': {
    text: 'Awaiting my review',
    icon: 'hourglass',
    designerOnly: true
  }
}

// A case can be bookmarked by either reference; `param` is its hub filter.
const BOOKMARK_TYPES = {
  case: {
    label: 'Case ID',
    short: 'Case',
    icon: 'hash',
    param: 'case',
    emptyError: 'Enter a case ID'
  },
  sbi: {
    label: 'SBI application number',
    short: 'SBI',
    icon: 'id-card',
    param: 'sbi',
    emptyError: 'Enter an SBI application number'
  }
}

const REFERENCE_MAX_LENGTH = 20

function allDocuments(req) {
  return manageGuidance.buildManageGuidanceSearchResults(req, '')
}

function documentHref(base, id) {
  return `${base}/guide/${id}`
}

// Collapsed (icon rail) vs expanded — one session flag shared across every
// page, same reasoning as the context pane's own collapsed flag. Unset means
// neither has been chosen yet, so the nav auto-collapses on mid-width
// windows (_app-side-nav.scss).
function getNavCollapsed(req) {
  return req.session.data.sideNavCollapsed === true
}

function getNavAutoCollapse(req) {
  return req.session.data.sideNavCollapsed === undefined
}

function setNavCollapsed(req, collapsed) {
  req.session.data.sideNavCollapsed = Boolean(collapsed)
}

// The expanded nav's dragged width, kept for the session so it holds
// across pages (the context pane's resize never persisted — a known gap).
// null means the stylesheet default.
const NAV_WIDTH = { min: 220, max: 440, default: 280 }

function getNavWidth(req) {
  const width = req.session.data.sideNavWidth
  return typeof width === 'number' ? width : null
}

function setNavWidth(req, value) {
  const width = Math.round(Number(value))
  if (!Number.isFinite(width)) return
  req.session.data.sideNavWidth = Math.min(
    NAV_WIDTH.max,
    Math.max(NAV_WIDTH.min, width)
  )
}

function getPinned(req) {
  if (!req.session.data.pinnedGuidance) {
    req.session.data.pinnedGuidance = [
      { id: 'cs-ma-evidence-required-2026' },
      { id: 'hedgerow-management-standards' },
      { id: 'sfi-nutrient-management-actions' }
    ]
  }
  return req.session.data.pinnedGuidance
}

function isPinned(req, id) {
  return getPinned(req).some((entry) => entry.id === id)
}

function togglePin(req, id) {
  const pinned = getPinned(req)
  const index = pinned.findIndex((entry) => entry.id === id)
  if (index === -1) pinned.unshift({ id })
  else pinned.splice(index, 1)
}

// `guideBookmarks`, not the first build's `caseBookmarks` (case ID only), so
// an older session's differently shaped data is simply ignored.
function getBookmarks(req) {
  if (!req.session.data.guideBookmarks) {
    req.session.data.guideBookmarks = [
      {
        type: 'case',
        ref: 'CASE-10482',
        documentIds: [
          'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026',
          'cs-ma-evidence-required-2026',
          'cs-mid-tier-hedgerow-and-boundary-options'
        ]
      },
      {
        type: 'sbi',
        ref: '123456789',
        documentIds: ['sfi-soil-health-actions']
      }
    ]
  }
  // `sections` pins a bookmark to specific sections of its guides
  // ({ documentId, anchor, label }); `documentIds` still lists every guide
  // in it, so readers that only care about guides are unchanged. Backfilled
  // for sessions from before section bookmarks.
  req.session.data.guideBookmarks.forEach((bookmark) => {
    bookmark.sections = bookmark.sections || []
  })
  return req.session.data.guideBookmarks
}

function findBookmark(req, type, ref) {
  return getBookmarks(req).find(
    (bookmark) => bookmark.type === type && bookmark.ref === ref
  )
}

function normaliseReference(value) {
  return (value || '').replace(/\s+/g, '').toUpperCase()
}

// Returns an error { field, text } or null. Bookmarking a guide to a
// reference that already exists adds it there rather than duplicating it.
// `section` ({ anchor, label }, already validated against the guide by the
// caller) pins the bookmark to that section as well.
function addBookmark(req, type, rawRef, documentId, section) {
  const kind = BOOKMARK_TYPES[type]
  if (!kind) {
    return {
      field: 'type',
      text: 'Select if you are bookmarking by case ID or SBI application number'
    }
  }
  const ref = normaliseReference(rawRef)
  if (!ref) {
    return { field: 'ref', text: kind.emptyError }
  }
  if (ref.length > REFERENCE_MAX_LENGTH) {
    return {
      field: 'ref',
      text: `${kind.label} must be ${REFERENCE_MAX_LENGTH} characters or fewer`
    }
  }
  if (!/^[A-Z0-9-]+$/.test(ref)) {
    return {
      field: 'ref',
      text: `${kind.label} must only include letters, numbers and hyphens`
    }
  }
  if (!allDocuments(req).some((document) => document.id === documentId)) {
    return { field: 'ref', text: 'This guide cannot be bookmarked' }
  }

  let bookmark = findBookmark(req, type, ref)
  if (!bookmark) {
    bookmark = { type, ref, documentIds: [], sections: [] }
    getBookmarks(req).unshift(bookmark)
  }
  if (bookmark.documentIds.indexOf(documentId) === -1) {
    bookmark.documentIds.push(documentId)
  }
  if (
    section &&
    !bookmark.sections.some(
      (entry) =>
        entry.documentId === documentId && entry.anchor === section.anchor
    )
  ) {
    bookmark.sections.push({
      documentId,
      anchor: section.anchor,
      label: section.label
    })
  }
  return null
}

// Without documentId, removes the whole bookmark (the nav's "…" menu);
// with it, takes that guide off the bookmark (the guide's own page); with
// an anchor too, just that section — and the guide with it once it was
// the guide's last bookmarked section (a deliberate simplification: a
// whole-guide bookmark and a section bookmark aren't tracked apart).
function removeBookmark(req, type, ref, documentId, anchor) {
  const bookmarks = getBookmarks(req)
  const index = bookmarks.findIndex(
    (bookmark) => bookmark.type === type && bookmark.ref === ref
  )
  if (index === -1) return
  if (!documentId) {
    bookmarks.splice(index, 1)
    return
  }
  const bookmark = bookmarks[index]
  const forGuide = (entry) => entry.documentId === documentId
  if (anchor) {
    bookmark.sections = bookmark.sections.filter(
      (entry) => !(forGuide(entry) && entry.anchor === anchor)
    )
    if (bookmark.sections.some(forGuide)) return
  } else {
    bookmark.sections = bookmark.sections.filter((entry) => !forGuide(entry))
  }
  const ids = bookmark.documentIds
  const docIndex = ids.indexOf(documentId)
  if (docIndex !== -1) ids.splice(docIndex, 1)
  if (!ids.length) bookmarks.splice(index, 1)
}

// A section link that lands on the right stepper page (or traditional
// anchor) — guide/section/'s redirect works that out from the guide itself.
function sectionHref(base, documentId, anchor) {
  return `${documentHref(base, documentId)}/section/${encodeURIComponent(anchor)}`
}

// The bookmark a hub request filters to (?case= or ?sbi=), or null.
function readBookmarkFilter(query) {
  for (const type of Object.keys(BOOKMARK_TYPES)) {
    const value = query[BOOKMARK_TYPES[type].param]
    if (typeof value === 'string' && value) return { type, ref: value }
  }
  return null
}

function bookmarkFilterHref(hub, type, ref) {
  return `${hub}?${BOOKMARK_TYPES[type].param}=${encodeURIComponent(ref)}`
}

// The id set a quick filter (or a single bookmark) narrows the hub list
// to, or null for an unknown list name.
function getListIds(req, list, bookmarkFilter) {
  if (bookmarkFilter) {
    const bookmark = findBookmark(req, bookmarkFilter.type, bookmarkFilter.ref)
    return bookmark ? bookmark.documentIds.slice() : []
  }

  switch (list) {
    case 'recently-opened':
      return guidanceLists.getRecentlyOpened(req).map((entry) => entry.id)
    case 'pinned':
      return guidanceLists.getPinnedGuidance(req).map((entry) => entry.id)
    case 'bookmarked': {
      const ids = []
      getBookmarks(req).forEach((bookmark) => {
        bookmark.documentIds.forEach((id) => {
          if (ids.indexOf(id) === -1) ids.push(id)
        })
      })
      return ids
    }
    case 'awaiting-review':
      return manageGuidance
        .buildManageGuidanceRows(req)
        .awaitingApprovalDocuments.map((row) => row.id)
    default:
      return null
  }
}

// The quick filters this role can use, each with how many hub documents it
// matches — shared by the nav and the hub's quick-filter row so the two
// always agree.
function getQuickFilters(req, base = DEFAULT_BASE) {
  const role = getRole(req)
  const known = new Set(allDocuments(req).map((document) => document.id))

  return Object.keys(LISTS)
    .filter((id) => !LISTS[id].designerOnly || role === 'designer')
    .map((id) => ({
      id,
      text: LISTS[id].text,
      icon: LISTS[id].icon,
      designerOnly: Boolean(LISTS[id].designerOnly),
      count: getListIds(req, id).filter((docId) => known.has(docId)).length,
      href: `${base}/hub?list=${id}`
    }))
}

// "Bookmark this guide to a case" on a guide's own page
// (partials/bookmark-form.njk). A failed submit leaves a one-shot flash,
// read here only on the page for the same guide, to reopen the form with
// the values entered and an inline error.
function buildBookmarkForm(req, documentId, base = DEFAULT_BASE) {
  const flash = req.session.data.guideBookmarkFlash
  const ownFlash = flash && flash.documentId === documentId ? flash : null
  if (ownFlash) delete req.session.data.guideBookmarkFlash

  const hub = `${base}/hub`
  const existing = getBookmarks(req)
    .filter((bookmark) => bookmark.documentIds.indexOf(documentId) !== -1)
    .map((bookmark) => ({
      type: bookmark.type,
      ref: bookmark.ref,
      typeLabel: BOOKMARK_TYPES[bookmark.type].short,
      href: bookmarkFilterHref(hub, bookmark.type, bookmark.ref)
    }))

  const selectedType =
    ownFlash && BOOKMARK_TYPES[ownFlash.type] ? ownFlash.type : 'case'

  return {
    documentId,
    addHref: `${base}/case-bookmarks/add`,
    removeHref: `${base}/case-bookmarks/remove`,
    returnTo: req.originalUrl.split('#')[0],
    error: ownFlash ? ownFlash.error : null,
    errorList: ownFlash
      ? [
          {
            text: ownFlash.error.text,
            href:
              ownFlash.error.field === 'type'
                ? '#bookmark-type'
                : '#bookmark-ref'
          }
        ]
      : [],
    ref: ownFlash ? ownFlash.ref || '' : '',
    types: Object.keys(BOOKMARK_TYPES).map((type) => ({
      value: type,
      text: BOOKMARK_TYPES[type].label,
      checked: type === selectedType
    })),
    existing
  }
}

// Only same-site paths — returnTo comes straight from a form field.
function safeReturnTo(value, fallback = `${DEFAULT_BASE}/hub`) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : fallback
}

function buildSideNav(req, base = DEFAULT_BASE) {
  const hub = `${base}/hub`
  const role = getRole(req)
  const documents = allDocuments(req)
  const titles = {}
  documents.forEach((document) => {
    titles[document.id] = document.title
  })

  const fullPath = req.baseUrl + req.path
  const onHub = fullPath === hub || fullPath === `${hub}/`
  const activeList =
    onHub && typeof req.query.list === 'string' ? req.query.list : ''
  const activeBookmark = onHub ? readBookmarkFilter(req.query) : null

  const quickFilters = getQuickFilters(req, base).map((filter) => ({
    ...filter,
    current: activeList === filter.id && !activeBookmark
  }))

  const coreItems = [
    {
      text: 'Hub',
      href: hub,
      icon: 'home',
      current: onHub && !activeList && !activeBookmark
    }
  ].concat(quickFilters.filter((filter) => !filter.designerOnly))

  const designerItems =
    role === 'designer'
      ? quickFilters
          .filter((filter) => filter.designerOnly)
          .map((filter) => ({ ...filter, badge: filter.count }))
          .concat([
            {
              text: 'Upload guidance',
              href: `${base}/upload`,
              icon: 'upload',
              current: fullPath.indexOf(`${base}/upload`) === 0
            }
          ])
      : []

  const pinned = getPinned(req)
    .filter((entry) => titles[entry.id])
    .map((entry) => ({
      id: entry.id,
      title: titles[entry.id],
      href: documentHref(base, entry.id),
      current: fullPath === documentHref(base, entry.id)
    }))

  const cases = getBookmarks(req).map((bookmark) => {
    const kind = BOOKMARK_TYPES[bookmark.type]
    const guides = bookmark.documentIds
      .filter((id) => titles[id])
      .map((id) => ({
        id,
        title: titles[id],
        href: documentHref(base, id),
        sections: bookmark.sections
          .filter((entry) => entry.documentId === id)
          .map((entry) => ({
            label: entry.label,
            href: sectionHref(base, id, entry.anchor)
          }))
      }))
    return {
      type: bookmark.type,
      typeLabel: kind.short,
      typeFullLabel: kind.label,
      icon: kind.icon,
      ref: bookmark.ref,
      href: bookmarkFilterHref(hub, bookmark.type, bookmark.ref),
      current: Boolean(
        activeBookmark &&
        activeBookmark.type === bookmark.type &&
        activeBookmark.ref === bookmark.ref
      ),
      guides
    }
  })

  const labels = ROLE_LABELS[role]

  return {
    role,
    roleLabel: labels.role,
    teamLabel: labels.team,
    otherRole: role === 'designer' ? 'viewer' : 'designer',
    switchRoleHref: `${base}/switch-role`,
    collapsed: getNavCollapsed(req),
    autoCollapse: getNavAutoCollapse(req),
    toggleHref: `${base}/side-nav/toggle`,
    width: getNavWidth(req),
    widthLimits: NAV_WIDTH,
    widthHref: `${base}/side-nav/width`,
    returnTo: req.originalUrl,
    searchAction: hub,
    searchQuery: onHub && typeof req.query.q === 'string' ? req.query.q : '',
    coreItems,
    designerItems,
    pinned,
    pinToggleHref: `${base}/pin-toggle`,
    cases,
    removeBookmarkHref: `${base}/case-bookmarks/remove`,
    footerItems: [{ text: 'Help', href: '#', icon: 'help' }]
  }
}

module.exports = {
  getRole,
  setRole,
  getNavCollapsed,
  setNavCollapsed,
  setNavWidth,
  getPinned,
  isPinned,
  togglePin,
  getBookmarks,
  findBookmark,
  normaliseReference,
  addBookmark,
  removeBookmark,
  sectionHref,
  readBookmarkFilter,
  getListIds,
  getQuickFilters,
  buildSideNav,
  buildBookmarkForm,
  safeReturnTo,
  LISTS,
  BOOKMARK_TYPES
}
