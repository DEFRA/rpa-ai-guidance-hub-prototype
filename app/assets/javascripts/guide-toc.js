// Keeps the contents sidebar in step with the reader: the entry for the
// last heading scrolled past stays marked (aria-current="location") until
// the next heading arrives, and its parent section is marked as the group
// it sits in. Only headings on the page shown are tracked, so a hidden
// stepper page never claims the mark; they're found again when the page
// changes. While the keyword search's current match is in sight
// (guide-keyword-search.js), the entry it comes under is marked instead.
;(function () {
  const toc = document.querySelector('[data-guide-toc]')
  if (!toc) return

  let entries = []
  function collect() {
    entries = []
    toc.querySelectorAll('[data-guide-toc-target]').forEach((link) => {
      const heading = document.getElementById(
        link.getAttribute('data-guide-toc-target')
      )
      // A stepper page not being read is hidden="until-found", which
      // still lays its headings out (for the browser's find), so a layout
      // box alone doesn't mean the heading is on the page shown.
      if (
        heading &&
        !heading.closest('[hidden]') &&
        heading.getClientRects().length
      ) {
        entries.push({ heading, link, parent: parentLink(link) })
      }
    })
  }
  collect()

  // A part's section link: the section paragraph before its list, or the
  // nearest earlier top-level item in the flat (API guide) list.
  function parentLink(link) {
    const item = link.closest('li')
    if (!item) return null
    if (item.classList.contains('app-guide-contents__item--depth-3')) {
      let previous = item.previousElementSibling
      while (
        previous &&
        !previous.classList.contains('app-guide-contents__item--depth-2')
      ) {
        previous = previous.previousElementSibling
      }
      return previous && previous.querySelector('a')
    }
    const list = item.closest('ol')
    const section = list && list.previousElementSibling
    return section ? section.querySelector('a') : null
  }

  let active = null
  let ticking = false
  let match = {}

  // The entry the keyword search's current match comes under, while the
  // match is in sight.
  function holdingMatch() {
    if (!match.range || !match.link) return null
    const box = match.range.getBoundingClientRect()
    const inSight =
      box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight
    return inSight ? entries.find((entry) => entry.link === match.link) : null
  }

  function atReadingLine() {
    // The last heading above the top quarter of the viewport is current.
    const line = window.innerHeight * 0.25
    let current = entries[0]
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= line) current = entry
      else break
    }
    return current
  }

  function update() {
    ticking = false
    if (!entries.length) return
    const current = holdingMatch() || atReadingLine()
    if (current === active) return

    if (active) {
      active.link.removeAttribute('aria-current')
      if (active.parent) {
        active.parent.classList.remove('app-guide-contents__link--group')
      }
    }
    active = current
    active.link.setAttribute('aria-current', 'location')
    if (active.parent) {
      active.parent.classList.add('app-guide-contents__link--group')
    }

    // Keep the entry in view inside the sidebar's own scroll.
    const box = toc.getBoundingClientRect()
    const rect = active.link.getBoundingClientRect()
    if (rect.top < box.top || rect.bottom > box.bottom) {
      active.link.scrollIntoView({ block: 'nearest' })
    }
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(update)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  document.addEventListener('guide-pages:shown', () => {
    collect()
    onScroll()
  })
  document.addEventListener('guide-keyword-search:match', (event) => {
    match = event.detail || {}
    onScroll()
  })
  update()
})()
