const { locateAnchor, readFormat, buildHref } = require('../view-model')

// One stable link to a section or part of a guide — used by section
// bookmarks, the "Continue reading" inset and the hub's Recently opened —
// that lands on the right stepper page or traditional anchor for however
// this reader views the guide, since only the guide knows which page holds
// which section.
async function get(req, res) {
  const { id, anchor } = req.params
  const guideHref = '/playground/guide/' + encodeURIComponent(id)
  const found = await locateAnchor(req, id, anchor)

  if (!found) {
    res.redirect(guideHref)
    return
  }

  const format = readFormat(req, id)
  res.redirect(
    buildHref(id, format, format === 'stepper' ? found.pageNumber : null) +
      '#' +
      found.anchor
  )
}

module.exports = { get }
