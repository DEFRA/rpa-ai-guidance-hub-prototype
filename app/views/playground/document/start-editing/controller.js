const { canEdit } = require('../../../../data/permissions')
const lifecycle = require('../../../../data/guide-lifecycle')
const {
  getPlaygroundApiGuides
} = require('../../../../data/playground-api-guides')

// "Edit" on a guide with no draft — creates its one draft (following the
// latest version) for the rest of the session, then goes straight into the
// editor. Refused unless the reader can edit; a draft that is awaiting
// review is locked, so goes back to the guide instead.
async function post(req, res) {
  await getPlaygroundApiGuides(req)
  const id = req.params.id
  const guideHref = '/playground/guide/' + encodeURIComponent(id || '')

  if (!id || !lifecycle.lookupGuide(req, id) || !canEdit(req, id)) {
    res.redirect(guideHref)
    return
  }

  const draft = lifecycle.startDraft(req, id)
  res.redirect(
    draft.state === 'draft'
      ? '/playground/editor?id=' + encodeURIComponent(id)
      : guideHref
  )
}

module.exports = { post }
