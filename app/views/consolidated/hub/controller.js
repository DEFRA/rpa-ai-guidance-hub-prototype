const { guidanceDocuments } = require('../../../data/guidance-documents')
const guidanceLists = require('../../../data/guidance-lists')
const {
  getRemovedEditingIds,
  buildManageGuidanceSearchResults
} = require('../../../data/manage-guidance')
const viewModel = require('./view-model')

function get(req, res) {
  res.render('consolidated/hub/page.njk', viewModel.fromSession(req))
}

function getRemoveConfirm(req, res) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  res.render('consolidated/hub/remove-confirm.njk', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: viewModel.TAB_LIST_NAMES[req.query.tab] || null
  })
}

// "Yes, remove" — recently-opened/saved-guidance go through guidanceLists'
// own session arrays; editing goes through manage-guidance's removed-ids
// list instead (the same split the two retired remove-confirm pages each
// had their own version of).
function postRemove(req, res) {
  const tab = req.body.tab

  if (tab === 'editing') {
    if (req.body.id) {
      const removedIds = getRemovedEditingIds(req)
      if (removedIds.indexOf(req.body.id) === -1) removedIds.push(req.body.id)
    }
  } else {
    const list = guidanceLists.getListForTab(req, tab)
    if (list && req.body.id) {
      const index = list.findIndex((entry) => entry.id === req.body.id)
      if (index !== -1) list.splice(index, 1)
    }
  }

  res.redirect(
    '/consolidated/hub?tab=' +
      (viewModel.VALID_TABS.includes(tab) ? tab : viewModel.DEFAULT_TAB)
  )
}

function postSaveToSearch(req, res) {
  if (req.body && req.body.id) {
    guidanceLists.addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
}

// A simplified stand-in for the retired manage-guidance/search-guidance
// page's faceted filter UI — the consolidation plan's flowchart doesn't
// include search as part of the proposed unified journey, so this keeps
// the hub's search box genuinely working (a plain name match over every
// document across every state) without carrying over that page's
// Category/State/Scheme/Year facets, which are out of scope here.
function getSearch(req, res) {
  const query = (req.query.q || '').trim()
  const allResults = buildManageGuidanceSearchResults(req, '/consolidated/document')

  const results = query
    ? allResults.filter((document) =>
        document.title.toLowerCase().includes(query.toLowerCase())
      )
    : []

  res.locals.backHref = '/consolidated/hub'
  res.render('consolidated/hub/search.njk', { query, results })
}

module.exports = { get, getRemoveConfirm, postRemove, postSaveToSearch, getSearch }
