const { getAddedEditingIds } = require('../../../data/manage-guidance')
const { documentOverviewViewModel } = require('./view-model')

function get(req, res) {
  const viewModel = documentOverviewViewModel(req, req.params.id)

  if (!viewModel) {
    res.redirect('/consolidated/hub')
    return
  }

  res.render('consolidated/document/page.njk', viewModel)
}

// "Edit" on the Published state — moves the id into Draft for the rest of
// the session (getAddedEditingIds, folded into buildManageGuidanceRows'
// editingDocuments from then on), then straight into the editor, matching
// "Continue editing"'s own destination for a document already in Draft.
function postStartEditing(req, res) {
  const id = req.params.id
  if (id) {
    const addedIds = getAddedEditingIds(req)
    if (addedIds.indexOf(id) === -1) addedIds.push(id)
  }

  res.redirect('/consolidated/editor?id=' + encodeURIComponent(id || ''))
}

module.exports = { get, postStartEditing }
