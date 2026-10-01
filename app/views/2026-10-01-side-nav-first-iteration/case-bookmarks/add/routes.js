const govukPrototypeKit = require('govuk-prototype-kit')
const { addBookmark, safeReturnTo } = require('../../../../data/side-nav')

// "Bookmark this guide to a case" on a guide's own page
// (partials/bookmark-form.njk) — by case ID or SBI application number. On a
// validation error the entered values go into a one-shot session flash,
// which buildBookmarkForm reads to reopen the form with an inline error.
const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/case-bookmarks/add'
)

router.post('/', (req, res) => {
  const { documentId, type, ref } = req.body
  const returnTo = safeReturnTo(req.body.returnTo).split('#')[0]
  const error = addBookmark(req, type, ref, documentId)

  if (error) {
    // No fragment: the page's error summary takes focus itself on load.
    req.session.data.guideBookmarkFlash = { error, documentId, type, ref }
    return res.redirect(returnTo)
  }
  res.redirect(`${returnTo}#bookmark-to-case`)
})
