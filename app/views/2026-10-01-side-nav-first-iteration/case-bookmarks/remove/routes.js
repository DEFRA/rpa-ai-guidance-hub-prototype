const govukPrototypeKit = require('govuk-prototype-kit')
const { removeBookmark, safeReturnTo } = require('../../../../data/side-nav')

// Removes a whole bookmark (the side nav's "…" menu) or, with documentId,
// just this guide from it (the guide page's own "Remove" link).
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/case-bookmarks/remove'
)

router.post('/', (req, res) => {
  removeBookmark(req, req.body.type, req.body.ref, req.body.documentId)
  res.redirect(safeReturnTo(req.body.returnTo))
})
