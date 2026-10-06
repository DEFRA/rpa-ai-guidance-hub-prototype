//
// Guide lifecycle for the playground: a guide has immutable, always-Live
// versions plus at most one mutable draft that follows the latest version.
// "Awaiting review" is a locked state of that draft, never of a version.
//
// Seeded drafts come from manage-guidance.js's fixed rows; every change made
// this session lives in the session keys below, so manage-guidance.js (shared
// with frozen snapshots) is left untouched.
//

const guidanceLists = require('./guidance-lists')
const manageGuidance = require('./manage-guidance')
const { MOCK_GUIDES_ENABLED } = require('../lib/feature-flags')

const DRAFT_LABELS = { draft: 'Draft', 'awaiting-review': 'Awaiting review' }
const LIVE_LABEL = 'Live'

const TAG_COLOURS = ['green', 'purple', 'blue', 'orange', 'pink', 'turquoise']

function sessionMap(req, key) {
  if (!req.session.data[key]) req.session.data[key] = {}
  return req.session.data[key]
}

function versionTag(number) {
  return {
    text: `Version ${number}`,
    classes: `govuk-tag--${TAG_COLOURS[(number - 1) % TAG_COLOURS.length]}`
  }
}

function toVersion(number, source) {
  return {
    number,
    label: `Version ${number}`,
    lastUpdated: (source && source.lastUpdated) || '',
    published: (source && source.published) || '',
    versionNotes: (source && source.versionNotes) || '',
    tag: versionTag(number)
  }
}

// A mock guide, or an API guide (req.apiGuides, set by
// getPlaygroundApiGuides) — callers that don't render must await that first.
function lookupGuide(req, id) {
  return (
    manageGuidance.lookupAnyManageGuidanceDocument(id) ||
    (req.apiGuides || []).find((guide) => guide.id === id) ||
    null
  )
}

// Newest first; the first entry is the current Live version. Empty for a
// guide that has never been published.
function getVersions(req, id) {
  const document = lookupGuide(req, id)
  if (!document) return []

  const versions = []
  const liveNumber = parseInt(document.version.replace(/\D/g, ''), 10) || 1
  for (let number = 1; number <= liveNumber; number += 1) {
    const source = document.versions && document.versions[`version${number}`]
    versions.push(toVersion(number, source))
  }

  const approved = sessionMap(req, 'guideApprovedVersions')[id] || []
  approved.forEach((source) => versions.push(toVersion(source.number, source)))

  return versions.sort((a, b) => b.number - a.number)
}

function getLiveVersion(req, id) {
  return getVersions(req, id)[0] || null
}

// The guide's one draft, or null. `state` is 'draft' or 'awaiting-review'.
// Every seeded guide starts Live with no draft; drafts exist only once
// someone starts one this session.
function getDraft(req, id) {
  const own = sessionMap(req, 'guideOwnDrafts')[id]
  if (!own) return null
  const live = getLiveVersion(req, id)
  return { id, basedOnVersion: live ? live.number : null, ...own }
}

function getDraftIdsByState(req, state) {
  return getAllGuideIds(req).filter((id) => {
    const draft = getDraft(req, id)
    return draft && draft.state === state
  })
}

// Every guide the hub lists, in hub order: the seeded guides, plus any guide
// given a draft this session.
function getAllGuideIds(req) {
  const { editingDocuments, awaitingApprovalDocuments } =
    manageGuidance.buildManageGuidanceRows(req)
  const ids = []
  const add = (id) => {
    if (ids.indexOf(id) === -1) ids.push(id)
  }
  editingDocuments.forEach((row) => add(row.id))
  awaitingApprovalDocuments.forEach((row) => add(row.id))
  manageGuidance.MANAGE_GUIDANCE_PUBLISHED_SAMPLES.forEach((d) => add(d.id))
  Object.keys(sessionMap(req, 'guideOwnDrafts')).forEach(add)
  return ids
}

// Creates the guide's draft unless one already exists — there is only ever
// one. Returns the draft.
function startDraft(req, id) {
  const existing = getDraft(req, id)
  if (existing) return existing
  sessionMap(req, 'guideOwnDrafts')[id] = {
    state: 'draft',
    publishingChecks: 0,
    changesRequested: 0,
    lastModified: guidanceLists.formatToday()
  }
  return getDraft(req, id)
}

function setDraft(req, id, changes) {
  const draft = getDraft(req, id)
  sessionMap(req, 'guideOwnDrafts')[id] = {
    state: draft.state,
    publishingChecks: draft.publishingChecks,
    changesRequested: draft.changesRequested,
    lastModified: draft.lastModified,
    ...changes
  }
}

// Draft -> Awaiting review (locked). False when there is no editable draft.
function sendForReview(req, id) {
  const draft = getDraft(req, id)
  if (!draft || draft.state !== 'draft') return false
  setDraft(req, id, {
    state: 'awaiting-review',
    lastModified: guidanceLists.formatToday()
  })
  return true
}

// Awaiting review -> next immutable Live version; the draft is cleared.
function approveDraft(req, id) {
  const draft = getDraft(req, id)
  if (!draft || draft.state !== 'awaiting-review') return null

  const live = getLiveVersion(req, id)
  const number = live ? live.number + 1 : 1
  const today = guidanceLists.formatToday()
  const approved = sessionMap(req, 'guideApprovedVersions')
  approved[id] = (approved[id] || []).concat({
    number,
    lastUpdated: today,
    published: today,
    versionNotes: live
      ? 'Updated following review.'
      : 'Initial published version of this guidance.'
  })

  delete sessionMap(req, 'guideOwnDrafts')[id]
  return number
}

// Awaiting review -> back to an editable draft, with a change requested.
function rejectDraft(req, id) {
  const draft = getDraft(req, id)
  if (!draft || draft.state !== 'awaiting-review') return false
  setDraft(req, id, {
    state: 'draft',
    changesRequested: draft.changesRequested + 1
  })
  return true
}

// One hub row per guide. Viewers get Live guides only, with no draft
// information at all; designers get every guide, tagged with the Live label
// (if it has a version) and the draft's label (if it has a draft).
function buildHubResults(req, { includeNonLive }) {
  const rows = []
  if (!MOCK_GUIDES_ENABLED) return rows
  getAllGuideIds(req).forEach((id) => {
    const document = manageGuidance.lookupAnyManageGuidanceDocument(id)
    const live = getLiveVersion(req, id)
    if (!document || (!live && !includeNonLive)) return

    const draft = includeNonLive ? getDraft(req, id) : null
    const states = []
    if (live) states.push(LIVE_LABEL)
    if (draft) states.push(DRAFT_LABELS[draft.state])

    rows.push({
      id,
      title: document.title,
      description: document.description,
      version: live ? live.label : null,
      versionTag: live ? live.tag : null,
      lastUpdated: live
        ? live.lastUpdated || document.lastUpdated
        : draft.lastModified,
      published: live ? live.published : null,
      category: document.category,
      scheme: document.scheme,
      year: document.year,
      states
    })
  })
  return rows
}

module.exports = {
  buildHubResults,
  DRAFT_LABELS,
  LIVE_LABEL,
  versionTag,
  lookupGuide,
  getVersions,
  getLiveVersion,
  getDraft,
  getDraftIdsByState,
  getAllGuideIds,
  startDraft,
  sendForReview,
  approveDraft,
  rejectDraft
}
