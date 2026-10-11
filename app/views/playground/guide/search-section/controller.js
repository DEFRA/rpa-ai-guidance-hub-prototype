const { loadContent } = require('../view-model')
const { findSectionAnchor } = require('./view-model')

// Where an AI search result opens. The API names a section by its number,
// which only the guide's content can turn into an anchor, so this finds it
// and hands over to section/, which knows the reader's format.
async function get(req, res) {
  const { id, number } = req.params
  const guideHref = '/playground/guide/' + encodeURIComponent(id)
  const content = await loadContent(req, id)
  const anchor = content ? findSectionAnchor(content, number) : null

  res.redirect(
    anchor ? `${guideHref}/section/${encodeURIComponent(anchor)}` : guideHref
  )
}

module.exports = { get }
