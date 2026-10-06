const {
  getPlaygroundApiGuides
} = require('../../../data/playground-api-guides')
const {
  buildMarkdownGuideContent,
  loadApiGuideContent,
  loadGuideContent,
  groupPages,
  findAnchor
} = require('./guide-content')
const { resolveHashLinks } = require('../../../lib/heading-links')
const { getGuideMetadata, getStepperPages } = require('./guide-metadata')
const { getGuidePosition } = require('../../../data/guide-positions')
const { documentOverviewViewModel } = require('../document/view-model')
const {
  canEdit,
  isDesigner,
  hasRequestedEdit
} = require('../../../data/permissions')
const lifecycle = require('../../../data/guide-lifecycle')
const { issuesBase, mockIssueCount } = require('../issues/view-model')
const {
  getBookmarks,
  sectionHref,
  BOOKMARK_TYPES,
  isPinned
} = require('../../../data/side-nav')
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

// The reading page's width (_app-guide.scss's .app-guide-reading--*),
// after feedback that guides were easier to read in Word: a reader's own
// preference, so global rather than per-guide, saved by
// reading-width/routes.js. Presets rather than a drag handle — easier to
// hit, to say out loud in research, and to use from a keyboard.
const READING_WIDTHS = [
  { value: 'standard', text: 'Standard' },
  { value: 'wide', text: 'Wide' },
  { value: 'full', text: 'Full width' }
]

function getReadingWidth(req) {
  const width = req.session.data.guideReadingWidth
  return READING_WIDTHS.some((option) => option.value === width)
    ? width
    : 'standard'
}

function setReadingWidth(req, value) {
  if (READING_WIDTHS.some((option) => option.value === value)) {
    req.session.data.guideReadingWidth = value
  }
}

function buildHref(id, format, page, anchor) {
  const params = new URLSearchParams({ format })
  if (page) params.set('page', page)
  return (
    '/playground/guide/' +
    encodeURIComponent(id) +
    '?' +
    params.toString() +
    (anchor ? '#' + encodeURIComponent(anchor) : '')
  )
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
      removeHref: `${base}/case-bookmarks/remove`,
      sections: bookmark.sections
        .filter((entry) => entry.documentId === id)
        .map((entry) => ({
          anchor: entry.anchor,
          label: entry.label,
          href: sectionHref(base, id, entry.anchor)
        }))
    }))

  return {
    items,
    bookmarkHref: `${base}/guide/${encodeURIComponent(id)}/bookmark`
  }
}

// Which cases each section of this guide is bookmarked to, by anchor —
// shown beside the section's own heading.
function buildSectionBookmarks(req, id) {
  const byAnchor = {}
  getBookmarks(req).forEach((bookmark) => {
    bookmark.sections
      .filter((entry) => entry.documentId === id)
      .forEach((entry) => {
        byAnchor[entry.anchor] = byAnchor[entry.anchor] || []
        byAnchor[entry.anchor].push({
          typeLabel: BOOKMARK_TYPES[bookmark.type].short,
          ref: bookmark.ref
        })
      })
  })
  return byAnchor
}

// "You were last reading …" on a genuine entry to the guide — only when
// the saved position still exists and isn't just the top of the guide.
function buildResume(req, id, pages, base = '/playground') {
  const position = getGuidePosition(req, id)
  const found = position && findAnchor(pages, position.anchor)
  const first = pages[0].sections[0]
  if (
    !found ||
    found.anchor === first.id ||
    found.anchor === first.parts[0].id
  ) {
    return null
  }
  return { label: found.label, href: sectionHref(base, id, found.anchor) }
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
  const what = flash.sectionLabel ? `‘${flash.sectionLabel}’` : 'Guide'
  return {
    text: `${what} bookmarked to ${BOOKMARK_SUCCESS_PHRASE[flash.type]} ${flash.ref}`,
    href: `${base}/hub?${kind.param}=${encodeURIComponent(flash.ref)}`
  }
}

// Editor tools — Live version, the one draft and what can be done to it.
// Built for anyone who can edit the guide (a designer, or someone given
// delegated edit approval); only designers get the review actions.
function buildEditorActions(req, id, overview) {
  const { draft, current } = overview
  const designer = isDesigner(req)
  const encodedId = encodeURIComponent(id)
  const guideHref = `/playground/guide/${encodedId}`

  return {
    liveText: current ? `${current.label} is live` : 'Not yet published',
    draft: draft && {
      state: draft.state,
      statusText:
        draft.state === 'awaiting-review'
          ? 'Waiting for approval. Editing is locked until it is reviewed.'
          : 'You have unpublished edits',
      changesRequestedText: draft.changesRequested
        ? `${draft.changesRequested} ${draft.changesRequested === 1 ? 'round' : 'rounds'} of changes requested`
        : null
    },
    // Only a draft in the Draft state is mutable; Awaiting review is locked.
    continueEditingHref:
      draft && draft.state === 'draft'
        ? `/playground/editor?id=${encodedId}`
        : null,
    startEditingHref: draft
      ? null
      : `/playground/document/${encodedId}/start-editing`,
    approveHref:
      designer && draft && draft.state === 'awaiting-review'
        ? `${guideHref}/approve`
        : null,
    requestChangesHref:
      designer && draft && draft.state === 'awaiting-review'
        ? `${guideHref}/reject`
        : null,
    publishingChecks: mockIssueCount(),
    nextVersionLabel: `Version ${current ? current.number + 1 : 1}`,
    issuesHref: issuesBase(id)
  }
}

// The stepper/traditional model — pages, sections with jump links, per-page
// Previous/Next — shared by local and API guides (the bookmark/section
// modules re-read content by id through locateAnchor).
function buildFormatModel(req, id, content, stepperGroups) {
  const format = readFormat(req, id)

  // The stepper steps through pages — groups of whole sections from the
  // guide's metadata, or one section per page (guide-content.js's
  // groupPages) — not single parts, which don't scale to a 200-page Word
  // document. A legacy ?step=N (part number) still resolves to the page
  // holding that part, so old research links keep working.
  const pages = groupPages(content, stepperGroups)
  const totalPages = pages.length

  const pageOfPart = (partNumber) => {
    const part = content.flatParts[partNumber - 1]
    const found = part && findAnchor(pages, part.id)
    return found ? found.pageNumber : 1
  }

  const requestedPage = parseInt(req.query.page, 10)
  const pageNumber =
    requestedPage >= 1 && requestedPage <= totalPages
      ? requestedPage
      : req.query.step
        ? pageOfPart(parseInt(req.query.step, 10))
        : 1

  const pageNumberBySection = {}
  pages.forEach((page) => {
    page.sections.forEach((section) => {
      pageNumberBySection[section.sectionNumber] = page.pageNumber
    })
  })

  // Every section/part carries its own jump link — content itself
  // (guide-content.js) stays format-agnostic; only the view model knows
  // how an anchor turns into a URL. Traditional links to the in-page
  // anchor; the stepper to the anchor on the page that holds it.
  const pageHref = (number) => buildHref(id, 'stepper', number)
  const anchorHref = (item) =>
    format === 'traditional'
      ? '#' + item.id
      : buildHref(
          id,
          'stepper',
          pageNumberBySection[item.sectionNumber],
          item.id
        )

  // A branch (guidance-documents.js's own steps content, e.g.
  // cs-revenue-claims-processing-final-payment-guide's "Creating a New
  // Case" part) is content-authored — its options name a target part by
  // heading, not a URL. Resolved here, once, against the whole document
  // rather than per format, so a mistyped target fails loudly (undefined
  // href) instead of silently per page.
  const partByHeading = {}
  content.flatParts.forEach((part) => {
    partByHeading[part.heading] = part
  })

  function resolveBranchOptions(options) {
    return options.map((option) => {
      const target = option.target ? partByHeading[option.target] : null
      return { ...option, href: target ? anchorHref(target) : null }
    })
  }

  // Markdown parts have no body (and never branch).
  function resolveBody(body) {
    if (!Array.isArray(body)) return body
    return body.map((entry) =>
      entry && entry.type === 'branch'
        ? { ...entry, options: resolveBranchOptions(entry.options) }
        : entry
    )
  }

  const sectionBookmarks = buildSectionBookmarks(req, id)
  const bookmarkFields = (anchor) => ({
    bookmarkHref: `/playground/guide/${encodeURIComponent(id)}/bookmark?section=${anchor}`,
    bookmarkedTo: sectionBookmarks[anchor] || []
  })

  // Intra-document links in a converted guide resolve to the heading they
  // name, on whichever stepper page holds it.
  const linkTargets = content.flatParts.map((part) => ({
    text: part.heading,
    href: anchorHref(part)
  }))
  const linkedMarkdown = (part) =>
    part.markdown && resolveHashLinks(part.markdown, linkTargets)

  const sections = content.sections.map((section) => {
    const parts = section.parts.map((part) => ({
      ...part,
      ...bookmarkFields(part.id),
      href: anchorHref(part),
      markdown: linkedMarkdown(part),
      body: resolveBody(part.body)
    }))

    return {
      ...section,
      ...bookmarkFields(section.id),
      href: anchorHref(section),
      // Only the stepper has a "current" place in the contents list — the
      // sections on the page shown. Traditional has everything on one page.
      isCurrent:
        format !== 'traditional' &&
        pageNumberBySection[section.sectionNumber] === pageNumber,
      // Lets guide-pages.js move the contents list's "current" mark when
      // find-in-page reveals another stepper page.
      pageNumber: pageNumberBySection[section.sectionNumber],
      // The contents list's sub-list: a section's lead part is the section
      // itself, so only the parts after it are listed.
      contentsParts: parts.filter((part) => !part.isLead),
      parts
    }
  })

  // Every stepper page, not just the current one: the others render
  // hidden="until-found" (reading-content.njk), so the browser's own
  // find-in-page (Ctrl+F) still searches the whole guide and reveals the
  // page a match is on (guide-pages.js). Each page carries its own
  // Previous/Next, built here rather than in the pagination template so
  // the label text comes from data, not template array arithmetic.
  const stepperPages = pages.map((page) => ({
    pageNumber: page.pageNumber,
    title: page.title,
    isCurrent: page.pageNumber === pageNumber,
    sections: page.sections.map(
      (section) => sections[section.sectionNumber - 1]
    ),
    prevLink:
      page.pageNumber > 1
        ? {
            href: pageHref(page.pageNumber - 1),
            labelText: pages[page.pageNumber - 2].title
          }
        : null,
    nextLink:
      page.pageNumber < totalPages
        ? {
            href: pageHref(page.pageNumber + 1),
            labelText: pages[page.pageNumber].title
          }
        : null
  }))

  return {
    format,
    pages,
    pageNumber,
    totalPages,
    sections,
    stepperPages,
    formatHrefs: {
      stepper: buildHref(id, 'stepper'),
      traditional: buildHref(id, 'traditional')
    }
  }
}

// An API-sourced guide (app/lib/guidance-api-loader.js's isApiGuide
// entries) has no editing/awaiting-approval/published session state, so
// this bypasses documentOverviewViewModel's mock-lookup chain entirely
// rather than trying to make a uuid id match it — and no
// stepper/traditional sections/parts model either, so it also skips
// guideViewModel's own pagination/branch-resolution logic below, going
// straight from buildMarkdownGuideContent's `{ isApiGuide: true, html }`
// to the view model. Everything else genuinely shared between a mock and
// an API guide (pin, case bookmarks, reader metadata, the side panel
// itself) is built the same way either path.
async function buildMarkdownGuideViewModel(req, document) {
  const split = await loadApiGuideContent(
    document.apiId,
    document.latestVersionId,
    document.id
  )
  const format = split ? buildFormatModel(req, document.id, split, null) : null
  const content = format
    ? { sections: format.sections }
    : await buildMarkdownGuideContent(
        document.apiId,
        document.latestVersionId,
        document.id
      )
  const defaultVersionKey =
    document.version === 'Version 1' ? 'version1' : 'version2'
  const isEditor = canEdit(req, document.id)

  return {
    id: document.id,
    isApiGuide: true,
    version: document.version,
    versionTag: lifecycle.versionTag(
      parseInt(document.version.replace(/\D/g, ''), 10) || 1
    ),
    versionList: [],
    isOlderVersion: false,
    canRequestEdit: !canEdit(req, document.id),
    editRequested: hasRequestedEdit(req, document.id),
    requestEditHref: `/playground/guide/${encodeURIComponent(document.id)}/request-edit`,
    document: {
      id: document.id,
      name: document.title,
      version: document.version,
      versions: document.versions,
      description: document.description
    },
    currentVersion: document.versions[defaultVersionKey],
    status: 'Published',
    pin: {
      pinned: isPinned(req, document.id),
      href: '/playground/pin-toggle',
      returnTo: req.originalUrl
    },
    caseBookmarks: buildCaseBookmarks(req, document.id),
    bookmarkSuccess: buildBookmarkSuccess(req, document.id),
    metadata: buildMetadata(req, document.id, document),
    // No versions/publishing-checks data exists for an API guide (the
    // Prototype guides API is read-only — docs/prototype-guides-api.md's
    // "What this feature deliberately does not do") — so there is nothing
    // for editor tools to act on, designer or not.
    isEditor,
    editorActions: isEditor
      ? buildEditorActions(req, document.id, {
          draft: canEdit(req, document.id)
            ? lifecycle.getDraft(req, document.id)
            : null,
          current: lifecycle.getLiveVersion(req, document.id)
        })
      : null,
    content,
    ...(format && {
      isMarkdown: true,
      format: format.format,
      formatHrefs: format.formatHrefs,
      stepperPages: format.stepperPages,
      pageNumber: format.pageNumber,
      totalPages: format.totalPages
    }),
    readingWidth: getReadingWidth(req),
    readingWidths: READING_WIDTHS,
    readingWidthHref: '/playground/guide/reading-width',
    panelCollapsed: getPanelCollapsed(req),
    panelToggleHref: '/playground/guide/panel-toggle',
    panelWidth: getPanelWidth(req),
    panelWidthLimits: PANEL_WIDTH,
    panelWidthHref: '/playground/guide/panel-width',
    returnTo: req.originalUrl
  }
}

async function guideViewModel(req, id) {
  const apiDocument = await findApiGuide(req, id)
  if (apiDocument) return buildMarkdownGuideViewModel(req, apiDocument)

  const overview = documentOverviewViewModel(req, id, req.query.version)
  if (!overview) return null

  const { guidanceDocument, content } = loadGuideContent(id)
  const {
    format,
    pages,
    pageNumber,
    totalPages,
    sections,
    stepperPages,
    formatHrefs
  } = buildFormatModel(req, id, content, getStepperPages(id))

  const isEditor = canEdit(req, id) && !overview.isOlderVersion
  const isGenuineEntry = !req.query.page && !req.query.step
  const selectedHref = (version) =>
    version === overview.current
      ? `/playground/guide/${encodeURIComponent(id)}`
      : `/playground/guide/${encodeURIComponent(id)}?version=${version.number}`

  return {
    formatHrefs,
    format,
    id,
    trackRecentlyOpened: Boolean(guidanceDocument) && isGenuineEntry,
    version: overview.document.version,
    versionTag: overview.selected.tag,
    document: overview.document,
    currentVersion: overview.selected,
    versionList:
      overview.versions.length > 1
        ? overview.versions.map((version) => ({
            ...version,
            isCurrent: version === overview.current,
            isSelected: version === overview.selected,
            href: selectedHref(version)
          }))
        : [],
    isOlderVersion: overview.isOlderVersion,
    currentVersionHref: `/playground/guide/${encodeURIComponent(id)}`,
    canRequestEdit: !canEdit(req, id) && overview.versions.length > 0,
    editRequested: hasRequestedEdit(req, id),
    requestEditHref: `/playground/guide/${encodeURIComponent(id)}/request-edit`,
    status: overview.status,
    pin: overview.pin,
    caseBookmarks: buildCaseBookmarks(req, id),
    bookmarkSuccess: buildBookmarkSuccess(req, id),
    resume: isGenuineEntry ? buildResume(req, id, pages) : null,
    positionHref: `/playground/guide/${encodeURIComponent(id)}/position`,
    metadata: buildMetadata(req, id, overview.document),
    isEditor,
    editorActions: isEditor ? buildEditorActions(req, id, overview) : null,
    content: { sections },
    isMarkdown: Boolean(content.isMarkdown),
    isApiGuide: false,
    stepperPages,
    pageNumber,
    totalPages,
    readingWidth: getReadingWidth(req),
    readingWidths: READING_WIDTHS,
    readingWidthHref: '/playground/guide/reading-width',
    panelCollapsed: getPanelCollapsed(req),
    panelToggleHref: '/playground/guide/panel-toggle',
    panelWidth: getPanelWidth(req),
    panelWidthLimits: PANEL_WIDTH,
    panelWidthHref: '/playground/guide/panel-width',
    returnTo: req.originalUrl
  }
}

// The right-hand panel's session state, for any page that renders it (the
// guide page's own view model spells the same fields out inline).
function buildPanelState(req) {
  return {
    panelCollapsed: getPanelCollapsed(req),
    panelToggleHref: '/playground/guide/panel-toggle',
    panelWidth: getPanelWidth(req),
    panelWidthLimits: PANEL_WIDTH,
    panelWidthHref: '/playground/guide/panel-width',
    returnTo: req.originalUrl
  }
}

// The API guide with this id, or null (always null when the API isn't
// configured or has no guides).
async function findApiGuide(req, id) {
  const apiGuides = await getPlaygroundApiGuides(req)
  return apiGuides.find((candidate) => candidate.id === id) || null
}

// The section/ and position/ modules' shared lookup: where an anchor
// lives in a guide (its stepper page and label), or null.
async function locateAnchor(req, id, anchor) {
  const apiGuide = await findApiGuide(req, id)
  const content = apiGuide
    ? await loadApiGuideContent(apiGuide.apiId, apiGuide.latestVersionId, id)
    : loadGuideContent(id).content
  if (!content) return null
  return findAnchor(groupPages(content, getStepperPages(id)), anchor)
}

module.exports = {
  guideViewModel,
  findApiGuide,
  locateAnchor,
  buildMetadata,
  buildPanelState,
  readFormat,
  buildHref,
  getPanelCollapsed,
  setPanelCollapsed,
  setPanelWidth,
  setReadingWidth
}
