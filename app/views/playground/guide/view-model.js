const { guidanceDocuments } = require('../../../data/guidance-documents')
const { buildGuideContent } = require('../../../data/guide-content')
const { getGuideMetadata } = require('../../../data/guide-metadata')
const { documentOverviewViewModel } = require('../document/view-model')
const { getRole } = require('../../../data/context-pane')
const { getBookmarks, BOOKMARK_TYPES } = require('../../../data/side-nav')
const {
  uploadedGuide,
  V4_SCHEMES,
  V4_AUDIENCE,
  V4_SYSTEMS,
  CONVERTED_GUIDE_ID
} = require('../upload/view-model')

// The merged hub -> guide page (design-goals doc: collapse the four-click
// document overview -> format choice -> viewer flow into one click,
// folding the version/case-bookmark/editor controls and the stepper-vs-
// traditional format choice into this one page instead). Settled on the
// side-panel direction after comparing it against a top-toolbar and an
// inline layout — see page.notes.md.
const FORMATS = ['stepper', 'traditional']
const DEFAULT_FORMAT = 'stepper'

// Format is per-guide, not global — switching a stepper/traditional
// preference on one guide shouldn't silently change how a different guide
// opens.
function readFormat(req, id) {
  req.session.data.guideFormat = req.session.data.guideFormat || {}
  if (FORMATS.indexOf(req.query.format) !== -1) {
    req.session.data.guideFormat[id] = req.query.format
  }
  return FORMATS.indexOf(req.session.data.guideFormat[id]) !== -1
    ? req.session.data.guideFormat[id]
    : DEFAULT_FORMAT
}

// Collapsed vs expanded — a single session flag, the same convention as
// the side nav's own collapse (app/data/side-nav.js's getNavCollapsed/
// setNavCollapsed): global rather than per-guide, toggled by a plain form
// POST (panel-toggle/routes.js) so it works without JavaScript, and
// rendered as a slim icon rail rather than hidden outright when collapsed.
function getPanelCollapsed(req) {
  return req.session.data.guidePanelCollapsed === true
}

function setPanelCollapsed(req, collapsed) {
  req.session.data.guidePanelCollapsed = Boolean(collapsed)
}

// Drag-to-resize, the same convention as the side nav's own width
// (app/data/side-nav.js's NAV_WIDTH/getNavWidth/setNavWidth) — global
// rather than per-guide, saved by panel-width/routes.js so it holds across
// pages. null means the stylesheet default (PANEL_WIDTH.default below).
const PANEL_WIDTH = { min: 280, max: 480, default: 320 }

function getPanelWidth(req) {
  const width = req.session.data.guidePanelWidth
  return typeof width === 'number' ? width : null
}

function setPanelWidth(req, value) {
  const width = Math.round(Number(value))
  if (!Number.isFinite(width)) return
  req.session.data.guidePanelWidth = Math.min(
    PANEL_WIDTH.max,
    Math.max(PANEL_WIDTH.min, width)
  )
}

function buildHref(id, format, step) {
  const params = new URLSearchParams({ format })
  if (step) params.set('step', step)
  return '/playground/guide/' + encodeURIComponent(id) + '?' + params.toString()
}

function labelAll(values, labels) {
  return (values || []).map((value) => labels[value]).filter(Boolean)
}

// Reader-facing metadata, shown whether or not the viewer has edit rights —
// unlike editorActions below, which is gated to designers only.
function buildMetadata(req, id, document) {
  if (id === CONVERTED_GUIDE_ID) {
    const details = uploadedGuide(req)
    return {
      scheme: labelAll(details.scheme, V4_SCHEMES)[0] || null,
      owner: details.owner || null,
      goal: details.goal || null,
      requirements: details.requirements || null,
      systems: labelAll(details.systems, V4_SYSTEMS),
      audience: labelAll(details.audience, V4_AUDIENCE)
    }
  }

  const base = getGuideMetadata(id)
  return {
    scheme: document.scheme || null,
    owner: base.owner,
    goal: base.goal,
    requirements: base.requirements,
    systems: labelAll(base.systems, V4_SYSTEMS),
    audience: labelAll(base.audience, V4_AUDIENCE)
  }
}

// The panel's "Case bookmarks" section — reads app/data/side-nav.js's own
// store directly (getBookmarks) rather than buildBookmarkForm, which also
// builds the add/remove form now moved to its own page (guide/bookmark/).
function buildCaseBookmarks(req, id, base = '/playground') {
  const items = getBookmarks(req)
    .filter((bookmark) => bookmark.documentIds.indexOf(id) !== -1)
    .map((bookmark) => ({
      type: bookmark.type,
      ref: bookmark.ref,
      typeLabel: BOOKMARK_TYPES[bookmark.type].label,
      href: `${base}/hub?${BOOKMARK_TYPES[bookmark.type].param}=${encodeURIComponent(bookmark.ref)}`,
      removeHref: `${base}/case-bookmarks/remove`
    }))

  return {
    items,
    bookmarkHref: `${base}/guide/${encodeURIComponent(id)}/bookmark`
  }
}

// The success banner shown once, straight after guide/bookmark/ redirects
// back here — a one-shot flash the same way guideBookmarkFlash on that
// page's own errors works, cleared as soon as it's read.
// kind.label ("Case ID"/"SBI application number") reads fine as a radio
// option but not lowercased mid-sentence ("case id"), so this phrase is
// its own copy rather than a transform of it.
const BOOKMARK_SUCCESS_PHRASE = {
  case: 'case ID',
  sbi: 'SBI application number'
}

function buildBookmarkSuccess(req, id, base = '/playground') {
  const flash = req.session.data.guideBookmarkAdded
  if (!flash || flash.documentId !== id) return null
  delete req.session.data.guideBookmarkAdded

  const kind = BOOKMARK_TYPES[flash.type]
  return {
    text: `Guide bookmarked to ${BOOKMARK_SUCCESS_PHRASE[flash.type]} ${flash.ref}`,
    href: `${base}/hub?${kind.param}=${encodeURIComponent(flash.ref)}`
  }
}

// Editor-only controls — version switch, publishing checks, change
// history, continue editing — built from the same status/document shape
// document/view-model.js's documentOverviewViewModel already assembles
// (document/page.njk renders the same fields today, just as a separate
// page everyone had to click through rather than gated inline here).
function buildEditorActions(id, status, document) {
  return {
    status,
    versions: document.versions,
    changeHistory: Object.keys(document.versions || {}).map(
      (key) => document.versions[key]
    ),
    publishingChecks: document.publishingChecks,
    changesRequested: document.changesRequested,
    continueEditingHref:
      status !== 'Published'
        ? '/playground/editor?id=' + encodeURIComponent(id)
        : null,
    startEditingHref:
      status === 'Published'
        ? '/playground/document/' + encodeURIComponent(id) + '/start-editing'
        : null,
    issuesHref: '/playground/issues'
  }
}

function guideViewModel(req, id) {
  const overview = documentOverviewViewModel(req, id)
  if (!overview) return null

  const format = readFormat(req, id)

  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === id
  )
  const content = buildGuideContent(guidanceDocument)

  const totalParts = content.flatParts.length
  const requestedPart = parseInt(req.query.step, 10)
  const partNumber =
    requestedPart >= 1 && requestedPart <= totalParts ? requestedPart : 1

  const isEditor = getRole(req) === 'designer'

  // Every section/part carries its own jump link — content itself
  // (guide-content.js) stays format-agnostic; only the view model knows
  // how a part number turns into a URL. Stepper links to a `?step=`
  // page; traditional links to the part's own in-page anchor (#part.id),
  // since every part already sits on the one page there.
  const stepperHref = (partNumber) => buildHref(id, 'stepper', partNumber)
  const traditionalHref = (part) => '#' + part.id
  const targetHref =
    format === 'traditional'
      ? traditionalHref
      : (part) => stepperHref(part.partNumber)
  const sectionHref = (section) =>
    format === 'traditional'
      ? '#' + section.id
      : stepperHref(section.firstPartNumber)

  // A branch (guidance-documents.js's own steps content, e.g.
  // cs-revenue-claims-processing-final-payment-guide's "Creating a New
  // Case" part) is content-authored — its options name a target part by
  // heading, not a URL, same reasoning as stepperHref's own comment above.
  // Resolved here, once, against the whole document rather than per
  // format, so a mistyped target fails loudly (undefined href) instead of
  // silently per page.
  const partByHeading = {}
  content.flatParts.forEach((part) => {
    partByHeading[part.heading] = part
  })

  function resolveBranchOptions(options) {
    return options.map((option) => {
      const target = option.target ? partByHeading[option.target] : null
      return { ...option, href: target ? targetHref(target) : null }
    })
  }

  function resolveBody(body) {
    return body.map((entry) =>
      entry && entry.type === 'branch'
        ? { ...entry, options: resolveBranchOptions(entry.options) }
        : entry
    )
  }

  const contentWithHrefs = {
    sections: content.sections.map((section) => ({
      ...section,
      href: sectionHref(section),
      parts: section.parts.map((part) => ({
        ...part,
        href: targetHref(part),
        body: resolveBody(part.body)
      }))
    })),
    flatParts: content.flatParts.map((part) => ({
      ...part,
      href: targetHref(part),
      body: resolveBody(part.body)
    }))
  }

  // Built here, not in the pagination template, so the label text
  // (govukPagination's own labelText option) comes from data, not a
  // template doing array-index arithmetic.
  const prevLink =
    partNumber > 1
      ? {
          href: stepperHref(partNumber - 1),
          labelText: contentWithHrefs.flatParts[partNumber - 2].heading
        }
      : null
  const nextLink =
    partNumber < totalParts
      ? {
          href: stepperHref(partNumber + 1),
          labelText: contentWithHrefs.flatParts[partNumber].heading
        }
      : null

  return {
    formatHrefs: {
      stepper: buildHref(id, 'stepper'),
      traditional: buildHref(id, 'traditional')
    },
    format,
    id,
    trackRecentlyOpened: Boolean(guidanceDocument) && !req.query.step,
    version: overview.document.version,
    document: overview.document,
    currentVersion: overview.document.versions[overview.defaultVersionKey],
    status: overview.status,
    pin: overview.pin,
    caseBookmarks: buildCaseBookmarks(req, id),
    bookmarkSuccess: buildBookmarkSuccess(req, id),
    metadata: buildMetadata(req, id, overview.document),
    isEditor,
    editorActions: isEditor
      ? buildEditorActions(id, overview.status, overview.document)
      : null,
    content: contentWithHrefs,
    currentPart: contentWithHrefs.flatParts[partNumber - 1],
    partNumber,
    totalParts,
    prevLink,
    nextLink,
    panelCollapsed: getPanelCollapsed(req),
    panelToggleHref: '/playground/guide/panel-toggle',
    panelWidth: getPanelWidth(req),
    panelWidthLimits: PANEL_WIDTH,
    panelWidthHref: '/playground/guide/panel-width',
    returnTo: req.originalUrl
  }
}

module.exports = {
  guideViewModel,
  getPanelCollapsed,
  setPanelCollapsed,
  setPanelWidth
}
