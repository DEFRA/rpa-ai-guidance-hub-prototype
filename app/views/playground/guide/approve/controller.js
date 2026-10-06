const { isDesigner } = require('../../../../data/permissions')
const {
  getPlaygroundApiGuides
} = require('../../../../data/playground-api-guides')
const lifecycle = require('../../../../data/guide-lifecycle')

// A designer approves the draft awaiting review: it becomes the next
// immutable Live version and the draft is cleared.
async function post(req, res) {
  await getPlaygroundApiGuides(req)
  const id = req.params.id
  if (isDesigner(req)) lifecycle.approveDraft(req, id)
  res.redirect('/playground/guide/' + encodeURIComponent(id))
}

module.exports = { post }
