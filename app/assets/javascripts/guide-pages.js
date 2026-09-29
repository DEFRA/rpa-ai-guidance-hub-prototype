//
// Find-in-page (Ctrl+F) across the whole guide in the stepper. Every page
// is in the HTML; the ones not being read are hidden="until-found"
// (reading-content.njk), which the browser's own find still searches. On a
// match it fires `beforematch` on that page and un-hides it; this makes
// that a proper page change — the page you were on is hidden again, and
// the URL and the contents list's "current" mark follow.
//
// The revealed page keeps its server-rendered HTML rather than mounting
// the TipTap viewer: replacing the DOM under the browser's find highlight
// would lose the match and break "find next". Navigating to the page
// normally (Previous/Next, contents, refresh) gives the viewer as usual.
//
// Browsers without until-found treat the pages as plain [hidden], so find
// just covers the current page, as it did before.
//
;(function () {
  const pages = Array.from(document.querySelectorAll('[data-guide-page]'))
  if (pages.length < 2) return

  function showPage(page) {
    pages.forEach((other) => {
      if (other !== page) other.setAttribute('hidden', 'until-found')
    })
    page.removeAttribute('hidden')

    const number = page.getAttribute('data-guide-page')

    // Replace rather than push: find can hop across many pages, and each
    // hop shouldn't become a Back step.
    const url = new URL(window.location.href)
    url.searchParams.set('page', number)
    url.searchParams.delete('step')
    window.history.replaceState(window.history.state, '', url)

    document.querySelectorAll('[data-guide-contents-page]').forEach((entry) => {
      const current = entry.getAttribute('data-guide-contents-page') === number
      entry.classList.toggle('app-guide-contents__section--current', current)
      const link = entry.querySelector('a')
      if (current) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
  }

  pages.forEach((page) => {
    page.addEventListener('beforematch', () => showPage(page))
  })
})()
