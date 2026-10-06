//
// Who can see and edit what. Viewers see only Live guides; designers see
// every status. Anyone can be given temporary (session-long) delegated edit
// approval for one guide, which lets them edit its draft but not see
// non-Live guides.
//

const { getRole } = require('./context-pane')

function isDesigner(req) {
  return getRole(req) === 'designer'
}

function list(req, key) {
  if (!req.session.data[key]) req.session.data[key] = []
  return req.session.data[key]
}

function hasDelegatedEdit(req, id) {
  return list(req, 'delegatedEditIds').indexOf(id) !== -1
}

function canEdit(req, id) {
  return isDesigner(req) || hasDelegatedEdit(req, id)
}

function hasRequestedEdit(req, id) {
  return list(req, 'editRequestIds').indexOf(id) !== -1
}

function getEditRequestIds(req) {
  return list(req, 'editRequestIds').slice()
}

function requestEdit(req, id) {
  const requests = list(req, 'editRequestIds')
  if (requests.indexOf(id) === -1) requests.push(id)
}

// A designer approves a pending request; the request is consumed.
function grantEdit(req, id) {
  const granted = list(req, 'delegatedEditIds')
  if (granted.indexOf(id) === -1) granted.push(id)
  req.session.data.editRequestIds = list(req, 'editRequestIds').filter(
    (requested) => requested !== id
  )
}

module.exports = {
  isDesigner,
  canEdit,
  hasDelegatedEdit,
  hasRequestedEdit,
  getEditRequestIds,
  requestEdit,
  grantEdit
}
