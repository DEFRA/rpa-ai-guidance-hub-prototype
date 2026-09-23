const guidanceLists = require('../../../data/guidance-lists')
const { buildManageGuidanceRows } = require('../../../data/manage-guidance')

// The four sidebar tabs' own ?tab= values — also what the two "Remove"
// flows that used to return to /v6/find-guidance#<anchor> or
// /v6/all-guidance-docs#editing now redirect to directly (see
// app/views/v6/find-guidance/controller.js's postRemove and
// app/views/v6/manage-guidance/controller.js's postRemove). Unlike
// guidance-lists.js's own REMOVE_CONFIRM_TABS.anchor (which maps
// 'saved-guidance' to the mismatched 'favourited-guidance' — a leftover
// from that tab's own govukTabs id never being renamed to match its
// label), these four are used as-is, with no separate anchor/id mapping
// needed anywhere.
const VALID_TABS = [
  'recently-opened',
  'saved-guidance',
  'editing',
  'awaiting-approval'
]
const DEFAULT_TAB = 'recently-opened'

// One flat object, not nested per tab — keeps every variable name both
// source pages already used (recentlyOpenedDocuments/savedGuidanceDocuments
// from find-guidance's own view-model, editingDocuments/
// awaitingApprovalDocuments from all-guidance-docs' controller) exactly as
// it was, so their own table macros carry over into page.njk with no
// renaming. Session data itself is untouched — guidanceLists/
// buildManageGuidanceRows are the exact same functions the two old pages
// already called, called here instead, not reimplemented.
//
// activeTab is resolved here, not left to client-side JS, so the correct
// sidebar button/panel render already active on first paint — no flash of
// the wrong tab while JS attaches. An unrecognised or missing ?tab=
// (including every existing link elsewhere in the app that still points
// at the old /v6/find-guidance or /v6/all-guidance-docs URLs, now
// redirecting here with no ?tab= of their own) falls back to
// 'recently-opened'.
function fromSession(req) {
  const { editingDocuments, awaitingApprovalDocuments } =
    buildManageGuidanceRows(req)

  return {
    activeTab: VALID_TABS.includes(req.query.tab) ? req.query.tab : DEFAULT_TAB,
    recentlyOpenedDocuments: guidanceLists.buildFindGuidanceRows(
      guidanceLists.getRecentlyOpened(req)
    ),
    savedGuidanceDocuments: guidanceLists.buildFindGuidanceRows(
      guidanceLists.getSavedGuidance(req)
    ),
    editingDocuments,
    awaitingApprovalDocuments
  }
}

module.exports = { fromSession }
