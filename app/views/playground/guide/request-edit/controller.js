const { requestEdit } = require('../../../../data/permissions')
const lifecycle = require('../../../../data/guide-lifecycle')
const { findApiGuide } = require('../view-model')

// A viewer asks a designer for temporary edit access to a Live guide
// (mock or API).
async function post(req, res) {
  const id = req.params.id
  if (lifecycle.getLiveVersion(req, id) || (await findApiGuide(req, id))) {
    requestEdit(req, id)
  }
  res.redirect('/playground/guide/' + encodeURIComponent(id))
}

module.exports = { post }
