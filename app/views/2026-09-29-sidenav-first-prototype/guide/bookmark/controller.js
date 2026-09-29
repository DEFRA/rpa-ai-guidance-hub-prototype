const { documentOverviewViewModel } = require('../../document/view-model')
const { addBookmark, normaliseReference } = require('../../../../data/side-nav')
const { bookmarkPageViewModel, refFromBody } = require('./view-model')

function guideHref(id) {
  return '/2026-09-29-sidenav-first-prototype/guide/' + encodeURIComponent(id)
}

function get(req, res) {
  const id = req.params.id
  const overview = documentOverviewViewModel(req, id)
  if (!overview) {
    res.redirect('/2026-09-29-sidenav-first-prototype/hub')
    return
  }

  res.locals.backHref = guideHref(id)
  res.render(
    '2026-09-29-sidenav-first-prototype/guide/bookmark/page.njk',
    bookmarkPageViewModel(id, overview.document.name, {}, null)
  )
}

function post(req, res) {
  const id = req.params.id
  const overview = documentOverviewViewModel(req, id)
  if (!overview) {
    res.redirect('/2026-09-29-sidenav-first-prototype/hub')
    return
  }

  const type = req.body.type
  const ref = refFromBody(type, req.body)
  const error = addBookmark(req, type, ref, id)

  if (error) {
    res.locals.backHref = guideHref(id)
    res.render(
      '2026-09-29-sidenav-first-prototype/guide/bookmark/page.njk',
      bookmarkPageViewModel(id, overview.document.name, req.body, error)
    )
    return
  }

  // One-shot flash — guide/view-model.js's buildBookmarkSuccess reads and
  // clears it to show the panel's success banner.
  req.session.data.guideBookmarkAdded = {
    documentId: id,
    type,
    ref: normaliseReference(ref)
  }
  res.redirect(guideHref(id))
}

module.exports = { get, post }
