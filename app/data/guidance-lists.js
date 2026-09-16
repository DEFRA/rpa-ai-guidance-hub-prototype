//
// Session-backed "Recently opened" and "Saved guidance" lists for
// find-guidance.html — req.session.data.recentlyOpened/savedGuidance, each
// an array of { id, lastModified } (id being a guidance-documents.js id),
// most-recently-touched entry first. Seeded with the original fixed example
// rows the first time either is read in a given session, so every existing
// research script still starts from the same 4/3 rows; everything from
// there on is real session state — opening a document (recentlyOpened, see
// GET /find-guidance/document/:id) or clicking "Save to search" on
// document-overview.html (savedGuidance, see POST /find-guidance/save-to-search)
// adds to or bumps an entry, and "Yes, remove" on delete-search-confirm.html
// (see POST /find-guidance/remove) removes one, from whichever of the two
// lists it came from. This is scoped entirely to find-guidance and the
// routes that feed it — nothing else in the prototype (all-guidance-docs.html's
// own tabs included) reads either array.
//
// Shared, unmodified, by both v2's /find-guidance routes and v5's
// /v5/find-guidance routes (and the /v5/find-guidance page module) — session
// data is not namespaced per version, so opening a document in one also
// marks it recently opened in the other.
//

const { guidanceDocuments } = require('./guidance-documents')

const RECENTLY_OPENED_LIMIT = 5

function getRecentlyOpened(req) {
  if (!req.session.data.recentlyOpened) {
    req.session.data.recentlyOpened = [
      {
        id: 'cs-ma-revenue-options-claim-rule-signoff-2026',
        lastModified: '20 July 2026'
      },
      {
        id: 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026',
        lastModified: '15 August 2026'
      },
      {
        id: 'cs-ma-agreement-level-options-not-verified-2026',
        lastModified: '8 August 2026'
      },
      {
        id: 'cs-ma-claim-refresh-signoff-check-2026',
        lastModified: '1 August 2026'
      }
    ]
  }
  return req.session.data.recentlyOpened
}

function getSavedGuidance(req) {
  if (!req.session.data.savedGuidance) {
    req.session.data.savedGuidance = [
      {
        id: 'countryside-stewardship-capital-grants',
        lastModified: '20 July 2025'
      },
      {
        id: 'basic-payment-scheme-closing-rules',
        lastModified: '12 June 2025'
      },
      { id: 'sfi-soil-health-actions', lastModified: '3 May 2025' }
    ]
  }
  return req.session.data.savedGuidance
}

// A tab param, as already carried by find-guidance.html's own Remove links
// (?tab=recently-opened/saved-guidance) and REMOVE_CONFIRM_TABS in
// app/views/legacy/routes.js, to whichever session array that tab is backed
// by — used by the remove route to know which list to take an id out of.
function getListForTab(req, tabParam) {
  if (tabParam === 'recently-opened') return getRecentlyOpened(req)
  if (tabParam === 'saved-guidance') return getSavedGuidance(req)
  return null
}

// e.g. "4 September 2026" — the same day/full-month/year shape every
// lastModified value already uses, throughout guidance-documents.js and
// find-guidance.html's two lists alike.
function formatToday() {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
}

// Adds id to the front of list with today's date — or, if it is already
// there, removes the old entry first, so it moves to the front with an
// updated date rather than appearing twice.
function touchEntry(list, id) {
  const existingIndex = list.findIndex((entry) => entry.id === id)
  if (existingIndex !== -1) list.splice(existingIndex, 1)
  list.unshift({ id, lastModified: formatToday() })
}

function addRecentlyOpened(req, id) {
  const list = getRecentlyOpened(req)
  touchEntry(list, id)
  if (list.length > RECENTLY_OPENED_LIMIT) list.length = RECENTLY_OPENED_LIMIT
}

function addSavedGuidance(req, id) {
  touchEntry(getSavedGuidance(req), id)
}

// Builds find-guidance.html's table rows from a session list (id +
// lastModified) by looking up each id's title/version in guidanceDocuments
// — an id with no match is skipped rather than breaking the page (would
// only happen if guidance-documents.js ever lost an entry a session still
// references).
function buildFindGuidanceRows(list) {
  return list.reduce((rows, entry) => {
    const document = guidanceDocuments.find(
      (candidate) => candidate.id === entry.id
    )
    if (!document) return rows
    rows.push({
      id: document.id,
      title: document.title,
      version: document.version,
      lastModified: entry.lastModified
    })
    return rows
  }, [])
}

module.exports = {
  getRecentlyOpened,
  getSavedGuidance,
  getListForTab,
  formatToday,
  addRecentlyOpened,
  addSavedGuidance,
  buildFindGuidanceRows
}
