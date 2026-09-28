const guidanceLists = require('../../../../data/guidance-lists')
const { getRemovedEditingIds } = require('../../../../data/manage-guidance')

// "Yes, remove" — recently-opened/saved-guidance go through guidanceLists'
// own session arrays; editing goes through manage-guidance's removed-ids
// list instead (the same split the two retired remove-confirm pages each
// had their own version of). Returns to wherever the remove was started
// from (returnTo, carried through remove-confirm — see that page's own
// controller/template), falling back to the hub now that there's no
// ?tab= to fall back to instead.
function post(req, res) {
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

  res.redirect(req.body.returnTo || '/playground/hub')
}

module.exports = { post }
