// Keeps the contents sidebar in step with the reader: the entry for the
// last heading scrolled past stays marked (aria-current="location") until
// the next heading arrives, and its parent section is marked as the group
// it sits in. Only headings on the page shown are tracked, so a hidden
// stepper page never claims the mark.
;(function () {
  const toc = document.querySelector('[data-guide-toc]')
  if (!toc) return

  const entries = []
  toc.querySelectorAll('[data-guide-toc-target]').forEach((link) => {
    const heading = document.getElementById(
      link.getAttribute('data-guide-toc-target')
    )
    if (heading && heading.getClientRects().length) {
      entries.push({ heading, link, parent: parentLink(link) })
    }
  })
  if (!entries.length) return

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

  function update() {
    ticking = false
    // The last heading above the top quarter of the viewport is current.
    const line = window.innerHeight * 0.25
    let current = entries[0]
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= line) current = entry
      else break
    }
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
  update()
})()
