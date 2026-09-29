const { documentOverviewViewModel } = require('../../document/view-model')
const { addBookmark, normaliseReference } = require('../../../../data/side-nav')
const { locateAnchor } = require('../view-model')
const {
  bookmarkPageViewModel,
  refFromBody,
  returnHref
} = require('./view-model')

// A section bookmark (?section= from a section heading, or the form's
// hidden field on submit) — null for a whole-guide bookmark or an anchor
// this guide doesn't have.
function sectionFrom(id, anchor) {
  return anchor ? locateAnchor(id, String(anchor)) : null
}

function get(req, res) {
  const id = req.params.id
  const overview = documentOverviewViewModel(req, id)
  if (!overview) {
    res.redirect('/playground/hub')
    return
  }

  const section = sectionFrom(id, req.query.section)
  res.locals.backHref = returnHref(id, section)
  res.render(
    'playground/guide/bookmark/page.njk',
    bookmarkPageViewModel(id, overview.document.name, section, {}, null)
  )
}

function post(req, res) {
  const id = req.params.id
  const overview = documentOverviewViewModel(req, id)
  if (!overview) {
    res.redirect('/playground/hub')
    return
  }

  const section = sectionFrom(id, req.body.section)
  const type = req.body.type
  const ref = refFromBody(type, req.body)
  const error = addBookmark(req, type, ref, id, section)

  if (error) {
    res.locals.backHref = returnHref(id, section)
    res.render(
      'playground/guide/bookmark/page.njk',
      bookmarkPageViewModel(
        id,
        overview.document.name,
        section,
        req.body,
        error
      )
    )
    return
  }

  // One-shot flash — guide/view-model.js's buildBookmarkSuccess reads and
  // clears it to show the success banner.
  req.session.data.guideBookmarkAdded = {
    documentId: id,
    type,
    ref: normaliseReference(ref),
    sectionLabel: section ? section.label : null
  }
  res.redirect(returnHref(id, section))
}

module.exports = { get, post }
