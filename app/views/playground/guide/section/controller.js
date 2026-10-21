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

  // A hub keyword result passes its search on, for the page to run at once.
  const keywords =
    typeof req.query.keywords === 'string' ? req.query.keywords.trim() : ''
  const format = readFormat(req)
  const page = format === 'stepper' ? found.pageNumber : null
  res.redirect(
    buildHref(id, format, page, null, keywords) +
      '#' +
      found.anchor +
      textDirective(req.query.text)
  )
}

// A sharing link (guide-share-link.js) names a place in the section as a
// URL text fragment's text directive; it rides on the section's own anchor,
// since this redirect's fragment replaces the one the link arrived with.
// Only the characters an encoded directive uses, so it can't break the URL.
const DIRECTIVE_CHARACTERS = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,._~!*()'"
)

function textDirective(text) {
  if (typeof text !== 'string' || !text) return ''
  const safe = Array.from(text).every((c) => DIRECTIVE_CHARACTERS.has(c))
  return safe ? `:~:text=${text}` : ''
}

module.exports = { get }
