//
// Remembers where a reader is in a guide (guide/page.njk), so a 200-page
// guide can be picked up again where they left off. Progressive
// enhancement: without it the guide reads the same, just without the
// resume point being updated.
//
// Once the reader has scrolled (not on load, so an unanswered "Continue
// reading" inset isn't overwritten by the top of the guide), and whenever
// scrolling settles: the heading nearest the top of the window becomes
// the URL's #hash (so refresh, Back and copy-link keep the place) and is
// posted to guide/position/routes.js as the guide's resume point.
//
;(function () {
  const root = document.querySelector('[data-guide-position-href]')
  if (!root) return

  const href = root.getAttribute('data-guide-position-href')
  const headings = Array.from(document.querySelectorAll('[data-guide-anchor]'))
  if (!headings.length) return

  // Arriving at a specific place already (a bookmark, a deep link, a
  // refresh) makes the resume inset redundant.
  const resume = document.querySelector('[data-guide-resume]')
  if (resume && window.location.hash) resume.hidden = true

  let current = window.location.hash.slice(1) || null
  let saved = current
  let timer = null

  // The last heading that has scrolled near the top of the window (within
  // 120px, or a fifth of a short window) — i.e. the section being read, not
  // a short one's successor peeking in below it. At the very end of the
  // guide the last headings can never scroll that high, so there the last
  // heading on screen counts instead.
  function headingInView() {
    const scroller = document.scrollingElement || document.documentElement
    const atEnd =
      window.innerHeight + window.scrollY >= scroller.scrollHeight - 2
    const line = atEnd
      ? window.innerHeight
      : Math.min(120, window.innerHeight * 0.2)
    // Only headings on screen count — not those on hidden stepper pages
    // (guide-pages.js), whose positions mean nothing.
    const shown = headings.filter((heading) => !heading.closest('[hidden]'))
    if (!shown.length) return current
    let found = shown[0]
    for (const heading of shown) {
      if (heading.getBoundingClientRect().top > line) break
      found = heading
    }
    return found.getAttribute('data-guide-anchor')
  }

  function save(anchor, useBeacon) {
    if (!anchor || anchor === saved) return
    saved = anchor
    const body = new URLSearchParams({ anchor })
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(href, body)
    } else {
      window.fetch(href, { method: 'POST', body }).catch(() => {})
    }
  }

  function settle() {
    current = headingInView()
    const url = new URL(window.location.href)
    url.hash = current
    window.history.replaceState(window.history.state, '', url)
    save(current)
  }

  // Capture, so a scroll inside the side-nav shell's own scrolling column
  // counts as well as the window's.
  document.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 400)
    },
    { capture: true, passive: true }
  )

  window.addEventListener('pagehide', () => save(current, true))
})()
