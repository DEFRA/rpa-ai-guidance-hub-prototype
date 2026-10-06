const viewModel = require('./view-model')
const { isDesigner, grantEdit } = require('../../../data/permissions')

// Designer-only: a viewer is sent back to the hub.
async function get(req, res) {
  if (!isDesigner(req)) {
    res.redirect('/playground/hub')
    return
  }
  res.locals.backHref = '/playground/hub'
  res.render(
    'playground/edit-requests/page.njk',
    await viewModel.fromSession(req)
  )
}

// Gives the requester temporary edit access to the guide (see permissions.js).
function postApprove(req, res) {
  if (isDesigner(req)) grantEdit(req, req.params.id)
  res.redirect('/playground/edit-requests')
}

module.exports = { get, postApprove }
