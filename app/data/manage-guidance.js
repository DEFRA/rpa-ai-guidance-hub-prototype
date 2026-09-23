//
// "Manage guidance" (all-guidance-docs.html and everything reached from it)
// data and session-backed helpers — Editing/Awaiting approval rows built
// from guidance-documents.js entries, a small set of sample "Published"
// documents local to this page (not real guidance-documents.js entries —
// see MANAGE_GUIDANCE_PUBLISHED_SAMPLES below), and the session lists that
// track "Start editing"/"Remove"/"Send for approval" moving a document
// between those states.
//
// Shared, unmodified, by v5's /v5/manage-guidance/... routes (see
// app/views/legacy/routes.js) and v6's /v6/manage-guidance/... and
// /v6/editor-2-3-view/ routes — session data is not namespaced per
// version, so moving a document via "Start editing"/"Remove"/"Send for
// approval" in one also shows up in the other, the same reasoning
// app/data/guidance-lists.js documents for find-guidance's own session
// lists.
//

const { guidanceDocuments } = require('./guidance-documents')
const guidanceLists = require('./guidance-lists')

// "Hedgerow management standards" (Awaiting approval, row 3) did not exist
// in guidance-documents.js before an earlier change — see the entry added
// there (right after sfi-soil-health-actions), added specifically so this
// row has a real version to look up rather than an invented one, the same
// as every other row here.
function lookupGuidanceDocumentByTitle(title) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.title === title
  )
  if (!document) {
    throw new Error(
      `buildManageGuidanceRows: no guidance-documents.js entry titled "${title}"`
    )
  }
  return document
}

// Ids removed from the Editing tab via "Remove" (there is no equivalent
// action on Awaiting approval) — session-backed, the same
// seed-on-first-read/persist-for-the-rest-of-the-session approach
// find-guidance.html's own recentlyOpened/savedGuidance already use, just
// simpler: a list of removed ids to filter *out* of the Editing list every
// time it is built, rather than the list itself, since Editing's own rows
// are always rebuilt fresh from guidanceDocuments/the fixed placeholder
// counts below rather than kept in session as data.
function getRemovedEditingIds(req) {
  if (!req.session.data.manageGuidanceEditingRemovedIds) {
    req.session.data.manageGuidanceEditingRemovedIds = []
  }
  return req.session.data.manageGuidanceEditingRemovedIds
}

// The reverse of getRemovedEditingIds above — ids of sample Published
// documents (MANAGE_GUIDANCE_PUBLISHED_SAMPLES below) that "Start editing"
// on a document-overview page's Published branch has moved into Editing
// this session. buildManageGuidanceRows folds these into editingDocuments
// alongside the fixed rows, and buildManageGuidanceSearchResults excludes
// them from the Published list it builds, so a moved document appears in
// exactly one state at a time, never both.
function getAddedEditingIds(req) {
  if (!req.session.data.manageGuidanceEditingAddedIds) {
    req.session.data.manageGuidanceEditingAddedIds = []
  }
  return req.session.data.manageGuidanceEditingAddedIds
}

// Ids of real Editing-tab documents "Send for approval"
// (app/views/v6/editor-2-3-view/) has moved to Awaiting approval this
// session — the same session-backed move-by-id approach getAddedEditingIds
// above already uses for Published → Draft, just one state further along.
// buildManageGuidanceRows below moves the whole row (not a rebuilt one) out
// of editingDocuments and into awaitingApprovalDocuments, so its own
// publishingChecks/changesRequested/lastModified carry over unchanged —
// this is a real document that was already being edited, not a fresh start
// the way a moved Published sample is.
function getAddedAwaitingApprovalIds(req) {
  if (!req.session.data.manageGuidanceAwaitingApprovalAddedIds) {
    req.session.data.manageGuidanceAwaitingApprovalAddedIds = []
  }
  return req.session.data.manageGuidanceAwaitingApprovalAddedIds
}

function buildManageGuidanceRows(req) {
  const editing = [
    {
      title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026',
      publishingChecks: 19,
      changesRequested: 0,
      lastModified: '6 September 2026'
    },
    {
      title:
        'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026',
      publishingChecks: 8,
      changesRequested: 0,
      lastModified: '5 September 2026'
    },
    {
      title: 'CS MA Claim - Agreement Level Options not Verified 2026',
      publishingChecks: 34,
      changesRequested: 0,
      lastModified: '3 September 2026'
    },
    {
      title: 'CS MA Claim - Claim Refresh Signoff Check 2026',
      publishingChecks: 1,
      changesRequested: 0,
      lastModified: '1 September 2026'
    },
    {
      title: 'CS MA - Evidence Required',
      publishingChecks: 7,
      changesRequested: 0,
      lastModified: '30 August 2026'
    },
    {
      title: 'CS MA - Parcel not Under Control of SBI at Signoff 2026',
      publishingChecks: 0,
      changesRequested: 0,
      lastModified: '28 August 2026'
    },
    {
      title: 'CS MA Claim - AB12 or OP3 Maximum Eligible Weight 2026',
      publishingChecks: 3,
      changesRequested: 2,
      lastModified: '25 August 2026'
    },
    {
      title: 'CS MA Claim - Existing 2026',
      publishingChecks: 0,
      changesRequested: 0,
      lastModified: '20 August 2026'
    },
    {
      title: 'CS Revenue Claims Processing to Final Payment Guide',
      publishingChecks: 5,
      changesRequested: 1,
      lastModified: '7 September 2026'
    }
  ]

  const awaitingApproval = [
    {
      title: 'Countryside Stewardship: capital grants',
      publishingChecks: 0,
      changesRequested: 0,
      lastModified: '18 August 2026'
    },
    {
      title: 'Basic Payment Scheme: closing rules',
      publishingChecks: 2,
      changesRequested: 1,
      lastModified: '15 August 2026'
    },
    {
      title: 'Hedgerow management standards',
      publishingChecks: 0,
      changesRequested: 0,
      lastModified: '10 August 2026'
    },
    {
      title: 'Sustainable Farming Incentive: soil health actions',
      publishingChecks: 4,
      changesRequested: 1,
      lastModified: '5 August 2026'
    }
  ]

  const buildRows = (entries) =>
    entries.map((entry) => {
      const document = lookupGuidanceDocumentByTitle(entry.title)
      return {
        id: document.id,
        name: document.title,
        version: document.version,
        publishingChecks: entry.publishingChecks,
        changesRequested: entry.changesRequested,
        lastModified: entry.lastModified
      }
    })

  // A sample Published document moved into Editing via "Start editing" has
  // no guidance-documents.js entry to look up (it only ever existed in
  // MANAGE_GUIDANCE_PUBLISHED_SAMPLES) and no placeholder
  // publishingChecks/changesRequested/lastModified of its own either, so
  // those are given sensible just-started defaults here instead: no checks
  // have run and no changes have been requested yet, and it was last
  // modified today (guidanceLists.formatToday(), the same "4 September
  // 2026" style date find-guidance.html's own session-tracked lists
  // already use).
  const addedEditingIds = getAddedEditingIds(req)
  const addedFromPublished = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.filter(
    (document) => addedEditingIds.indexOf(document.id) !== -1
  ).map((document) => ({
    id: document.id,
    name: document.title,
    version: document.version,
    publishingChecks: 0,
    changesRequested: 0,
    lastModified: guidanceLists.formatToday()
  }))

  const removedEditingIds = getRemovedEditingIds(req)

  const allEditingRows = buildRows(editing)
    .concat(addedFromPublished)
    .filter((document) => removedEditingIds.indexOf(document.id) === -1)

  // "Send for approval" moves a row out of editingDocuments and into
  // awaitingApprovalDocuments — the whole row, carried over as-is (not
  // rebuilt with fresh placeholder counts the way addedFromPublished
  // above is), since this is an already-in-progress Editing document, not
  // a newly-started one.
  const addedAwaitingApprovalIds = getAddedAwaitingApprovalIds(req)
  const movedToAwaitingApproval = allEditingRows.filter(
    (document) => addedAwaitingApprovalIds.indexOf(document.id) !== -1
  )

  return {
    editingDocuments: allEditingRows.filter(
      (document) => addedAwaitingApprovalIds.indexOf(document.id) === -1
    ),
    awaitingApprovalDocuments: buildRows(awaitingApproval).concat(
      movedToAwaitingApproval
    )
  }
}

// A handful of sample "Published" documents for the manage-guidance search
// pages — genuinely local to this dataset, not real guidance-documents.js
// entries: nothing in the Editing or Awaiting approval tabs ever reaches a
// "Published" state today (there is no route that moves a document there),
// so there is nothing real to reuse the way Editing/Awaiting approval's own
// rows do. Shaped the same as a guidance-documents.js entry
// (id/title/description/version/lastUpdated/published/category/scheme/year)
// so buildManageGuidanceSearchResults below can treat all three states
// uniformly, but kept here rather than added there — state is a Manage
// guidance-only concept, and adding these to the shared file would make
// them show up on the Find guidance side too (organic-search.html,
// find-guidance.html), which nothing asked for.
//
// versions.version1/version2 (added for document-overview.html's own
// Version dropdown — see app/views/v6/manage-guidance/view-model.js) follow
// the exact same shape and convention every guidance-documents.js entry
// already uses: both are always present regardless of which one the
// document's own top-level `version` field currently points at as
// "current" — that field is only ever a highlight, not a statement that
// the other one doesn't exist (see e.g. cs-ma-revenue-options-claim-rule-
// signoff-2026 in guidance-documents.js, "Version 1" at the top level with
// a full version2 entry sitting right below it). version1's own
// versionNotes is always the exact literal "Initial published version of
// this guidance." there too — kept identical here for the same reason.
const MANAGE_GUIDANCE_PUBLISHED_SAMPLES = [
  {
    id: 'cs-mid-tier-hedgerow-and-boundary-options',
    title: 'CS Mid Tier: hedgerow and boundary options',
    description:
      'Explains the hedgerow and boundary management options available under a Mid Tier Countryside Stewardship agreement, and how they are assessed at application.',
    version: 'Version 2',
    versionNotes:
      'Updated to reflect revised scheme requirements and clarify eligibility criteria.',
    lastUpdated: '12 July 2026',
    published: '3 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '18 June 2024',
        published: '18 June 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '12 July 2026',
        published: '3 February 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'sfi-nutrient-management-actions',
    title: 'SFI: nutrient management actions',
    description:
      'Covers the nutrient management actions available under SFI, including record-keeping requirements and how they combine with other actions on the same land.',
    version: 'Version 1',
    versionNotes: 'Initial published version of this guidance.',
    lastUpdated: '28 May 2026',
    published: '9 January 2025',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '28 May 2026',
        published: '9 January 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '30 August 2026',
        published: '30 August 2026',
        versionNotes:
          'Updated to clarify record-keeping requirements and how this action combines with other SFI actions on the same land.'
      }
    }
  },
  {
    id: 'cs-higher-tier-wetland-and-grassland-options',
    title: 'CS Higher Tier: wetland and grassland options',
    description:
      'Sets out the wetland and species-rich grassland options available under a Higher Tier Countryside Stewardship agreement, and the evidence expected to support them.',
    version: 'Version 1',
    versionNotes: 'Initial published version of this guidance.',
    lastUpdated: '4 April 2026',
    published: '21 November 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '4 April 2026',
        published: '21 November 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '15 July 2026',
        published: '15 July 2026',
        versionNotes:
          'Updated to clarify evidence requirements for wetland and species-rich grassland options.'
      }
    }
  },
  {
    id: 'sfi-integrated-pest-management-actions',
    title: 'SFI: integrated pest management actions',
    description:
      'Explains the integrated pest management actions available under SFI, how they are checked, and what evidence to keep to support a claim.',
    version: 'Version 2',
    versionNotes:
      'Updated to reflect revised scheme requirements and clarify eligibility criteria.',
    lastUpdated: '19 August 2026',
    published: '14 October 2025',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '5 February 2025',
        published: '5 February 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '19 August 2026',
        published: '14 October 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  }
]

// The overview a Document name link on all-guidance-docs.html/
// manage-guidance-search.html/search-guidance.html now leads to, instead of
// straight into Edit or the old Action column's buttons — a stop in
// between, shaped differently depending on the document's state. ?id= is
// looked up against buildManageGuidanceRows() first (Editing, then
// Awaiting approval), then MANAGE_GUIDANCE_PUBLISHED_SAMPLES if neither
// matched.
function lookupAnyManageGuidanceDocument(id) {
  return (
    guidanceDocuments.find((candidate) => candidate.id === id) ||
    MANAGE_GUIDANCE_PUBLISHED_SAMPLES.find((candidate) => candidate.id === id)
  )
}

// The dataset behind the manage-guidance search-guidance page — every
// document currently in the Editing or Awaiting approval tabs
// (buildManageGuidanceRows(), the same rows all-guidance-docs.html and
// manage-guidance-search.html already show), plus whichever sample
// Published documents have not been moved into Editing via "Start editing"
// this session — each tagged with its own state ("Draft"/"Awaiting
// review"/"Published", a Manage guidance-only concept).
//
// overviewHrefBase is the /vN/manage-guidance/document-overview path this
// document's card should link to — passed in by the caller (rather than
// hardcoded here) so the same dataset/logic serves both v5 and v6 with each
// version's own overview links, not one version's links leaking into the
// other's page.
function buildManageGuidanceSearchResults(req, overviewHrefBase) {
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)
  const addedEditingIds = getAddedEditingIds(req)

  const fromRows = (rows, state) =>
    rows.map((row) => {
      const document = lookupAnyManageGuidanceDocument(row.id)
      return {
        id: document.id,
        title: document.title,
        description: document.description,
        version: document.version,
        lastUpdated: document.lastUpdated,
        published: document.published,
        category: document.category,
        scheme: document.scheme,
        year: document.year,
        state,
        overviewHref: `${overviewHrefBase}?id=${document.id}`
      }
    })

  const published = MANAGE_GUIDANCE_PUBLISHED_SAMPLES.filter(
    (document) => addedEditingIds.indexOf(document.id) === -1
  ).map((document) => ({
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
    overviewHref: `${overviewHrefBase}?id=${document.id}`
  }))

  return fromRows(editingDocuments, 'Draft')
    .concat(fromRows(awaitingApprovalDocuments, 'Awaiting review'))
    .concat(published)
}

module.exports = {
  getRemovedEditingIds,
  getAddedEditingIds,
  getAddedAwaitingApprovalIds,
  buildManageGuidanceRows,
  MANAGE_GUIDANCE_PUBLISHED_SAMPLES,
  lookupAnyManageGuidanceDocument,
  buildManageGuidanceSearchResults
}
