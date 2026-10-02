const { documentOverviewViewModel } = require('../../document/view-model')
const { addBookmark, normaliseReference } = require('../../../../data/side-nav')
const { locateAnchor, findApiGuide } = require('../view-model')
const {
  bookmarkPageViewModel,
  refFromBody,
  returnHref
} = require('./view-model')

// The guide's name (an API guide has no mock document overview) — null
// when the id is neither.
async function guideName(req, id) {
  const apiGuide = await findApiGuide(req, id)
  if (apiGuide) return { name: apiGuide.title }
  const overview = documentOverviewViewModel(req, id)
  return overview ? { name: overview.document.name } : null
}

// A section bookmark (?section= from a section heading, or the form's
// hidden field on submit) — null for a whole-guide bookmark or an anchor
// this guide doesn't have.
async function sectionFrom(req, id, anchor) {
  return anchor ? locateAnchor(req, id, String(anchor)) : null
}

async function get(req, res) {
  const id = req.params.id
  const guide = await guideName(req, id)
  if (!guide) {
    res.redirect('/playground/hub')
    return
  }

  const section = await sectionFrom(req, id, req.query.section)
  res.locals.backHref = returnHref(id, section)
  res.render(
    'playground/guide/bookmark/page.njk',
    bookmarkPageViewModel(id, guide.name, section, {}, null)
  )
}

async function post(req, res) {
  const id = req.params.id
  const guide = await guideName(req, id)
  if (!guide) {
    res.redirect('/playground/hub')
    return
  }

  const section = await sectionFrom(req, id, req.body.section)
  const type = req.body.type
  const ref = refFromBody(type, req.body)
  const error = addBookmark(req, type, ref, id, section)

  if (error) {
    res.locals.backHref = returnHref(id, section)
    res.render(
      'playground/guide/bookmark/page.njk',
      bookmarkPageViewModel(id, guide.name, section, req.body, error)
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
