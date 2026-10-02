const govukPrototypeKit = require('govuk-prototype-kit')
const { removeBookmark, safeReturnTo } = require('../../../../data/side-nav')

// Removes a whole bookmark (the side nav's "…" menu), with documentId just
// this guide from it (the guide page's own "Remove" link), or with an
// anchor too just that bookmarked section.
const router = govukPrototypeKit.requests.setupRouter(
  '/playground/case-bookmarks/remove'
)

router.post('/', (req, res) => {
  removeBookmark(
    req,
    req.body.type,
    req.body.ref,
    req.body.documentId,
    req.body.anchor
  )
  res.redirect(safeReturnTo(req.body.returnTo))
})
