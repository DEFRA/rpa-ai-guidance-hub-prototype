const guidanceLists = require('../../../data/guidance-lists')
const { buildManageGuidanceRows } = require('../../../data/manage-guidance')

// The hub's four tabs' own ?tab= values — also what removeViewModel/
// controller.js redirect back to after a remove.
const VALID_TABS = [
  'recently-opened',
  'saved-guidance',
  'editing',
  'awaiting-approval'
]
const DEFAULT_TAB = 'recently-opened'

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

// recently-opened/saved-guidance read/write guidanceLists' own session
// arrays; editing reads/writes manage-guidance's getRemovedEditingIds
// instead (awaiting-approval has no remove action on either source page,
// so is not handled here).
const TAB_LIST_NAMES = {
  'recently-opened': 'Recently opened',
  'saved-guidance': 'Saved guidance',
  editing: 'Editing'
}

module.exports = { VALID_TABS, DEFAULT_TAB, TAB_LIST_NAMES, fromSession }
