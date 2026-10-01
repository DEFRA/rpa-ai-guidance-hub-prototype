const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/hub/search'
)

// Retired — the hub itself is now the all-guidance list this page used to
// be (see hub/page.njk and hub/view-model.js). Kept as a redirect, not
// removed outright, so old links/bookmarks into this page (including its
// own ?q= convention) still land somewhere useful. See page.notes.md.
router.get('/', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : ''
  res.redirect(
    '/2026-10-01-side-nav-first-iteration/hub' +
      (query ? `?q=${encodeURIComponent(query)}` : '')
  )
})
