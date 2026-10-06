const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')
const lifecycle = require('../../../data/guide-lifecycle')
const { canEdit, isDesigner } = require('../../../data/permissions')
const { isPinned, buildBookmarkForm } = require('../../../data/side-nav')

// The Pin guide / Unpin guide control (pin-toggle, app/data/side-nav.js).
function buildPin(req, id) {
  return {
    pinned: isPinned(req, id),
    href: '/playground/pin-toggle',
    returnTo: req.originalUrl
  }
}

// The shared status/version resolver behind the guide page. A guide is its
// immutable Live versions plus at most one draft; only designers can open a
// guide that has no Live version, and only people who can edit it are given
// its draft. `requestedVersion` (?version=) selects an older Live version.
// Returns null when the guide is missing or this reader may not see it.
function documentOverviewViewModel(req, id, requestedVersion) {
  const full = lookupAnyManageGuidanceDocument(id)
  if (!full) return null

  const versions = lifecycle.getVersions(req, id)
  if (!versions.length && !isDesigner(req)) return null

  const current = versions[0] || null
  const draft = canEdit(req, id) ? lifecycle.getDraft(req, id) : null

  let selected = current
  if (requestedVersion) {
    selected = versions.find(
      (version) => String(version.number) === String(requestedVersion)
    )
    if (!selected) return null
  }

  // A never-published guide has no version to show: fall back to the draft.
  const shown = selected || {
    label: null,
    tag: null,
    lastUpdated: draft ? draft.lastModified : full.lastUpdated
  }

  return {
    document: {
      id: full.id,
      name: full.title,
      description: full.description,
      scheme: full.scheme,
      version: shown.label,
      versions
    },
    versions,
    current,
    selected: shown,
    isOlderVersion: Boolean(selected && current && selected !== current),
    draft,
    status: current
      ? lifecycle.LIVE_LABEL
      : lifecycle.DRAFT_LABELS[draft ? draft.state : 'draft'],
    pin: buildPin(req, id),
    bookmarkForm: buildBookmarkForm(req, id)
  }
}

module.exports = { documentOverviewViewModel }
