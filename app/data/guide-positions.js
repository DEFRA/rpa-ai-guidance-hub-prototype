// Where a reader last was in each guide, saved as they scroll
// (app/assets/javascripts/guide-position.js → guide/position/routes.js) —
// one position per guide, not a list, so it never clutters the case
// bookmarks. Read back by the guide page's "Continue reading" inset and
// the hub's Recently opened list.
function positions(req) {
  req.session.data.guidePositions = req.session.data.guidePositions || {}
  return req.session.data.guidePositions
}

function getGuidePosition(req, id) {
  return positions(req)[id] || null
}

// `found` is guide-content.js's findAnchor result — only an anchor that
// really exists in the guide is saved.
function setGuidePosition(req, id, found) {
  if (!found) return
  positions(req)[id] = { anchor: found.anchor, label: found.label }
}

module.exports = { getGuidePosition, setGuidePosition }
