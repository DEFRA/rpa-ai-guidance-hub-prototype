const { isDesigner } = require('../../../../data/permissions')
const {
  getPlaygroundApiGuides
} = require('../../../../data/playground-api-guides')
const lifecycle = require('../../../../data/guide-lifecycle')

// A designer sends the draft back: it unlocks, with a change requested.
async function post(req, res) {
  await getPlaygroundApiGuides(req)
  const id = req.params.id
  if (isDesigner(req)) lifecycle.rejectDraft(req, id)
  res.redirect('/playground/guide/' + encodeURIComponent(id))
}

module.exports = { post }
