//
// Search for keywords in the guide on the page (guide/page.njk). Ctrl+F
// (Cmd+F) comes to the box. Enter highlights every match and, in the
// contents, every section and part with one, and brings the first into
// view; Enter again goes to the next, Shift+Enter to the one before, round
// at either end.
//
// Matches are painted with the CSS Custom Highlight API rather than <mark>
// elements, so the TipTap viewer's DOM is never touched. In the stepper
// every page is in the HTML (reading-content.njk), so a match on another
// page shows that page, as the browser's find does (guide-pages.js).
//
;(function () {
  const form = document.querySelector('[data-guide-keyword-search]')
  if (!form) return

  const input = form.querySelector('input')
  const status = form.querySelector('[data-guide-keyword-search-status]')
  const toc = document.querySelector('[data-guide-toc]')
  const highlights = window.CSS && CSS.highlights

  // Room between a match brought into view and the edges of the window.
  const MARGIN = 16
  const MATCH_CLASS = 'app-guide-contents__link--match'

  // Text that isn't the guide's own: bookmark controls, hidden labels and
  // the TipTap viewer's Markdown source.
  const SKIP =
    'script, style, .app-guide-section-bookmark, .app-guide-section-bookmarked, .govuk-visually-hidden, [aria-hidden="true"]'

  let searched = ''
  let keywords = []
  let matches = []
  let current = -1

  // Ctrl+F (Cmd+F on a Mac) searches this guide, not just the page shown.
  input.setAttribute('aria-keyshortcuts', 'Control+F Meta+F')
  document.addEventListener('keydown', (event) => {
    const modified = event.ctrlKey || event.metaKey
    if (!modified || event.altKey || event.key.toLowerCase() !== 'f') return
    event.preventDefault()
    input.focus()
    input.select()
  })

  function keywordsOf(text) {
    return [...new Set(text.toLowerCase().split(/\s+/).filter(Boolean))]
  }

  // The guide's text: every section (every stepper page's too), or a guide
  // without sections as one block.
  function roots() {
    const sections = document.querySelectorAll('.app-guide-section')
    return sections.length
      ? Array.from(sections)
      : Array.from(
          document.querySelectorAll('.app-guide-reading > .app-guide-markdown')
        )
  }

  function textsIn(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement.closest(SKIP)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
    })
    const texts = []
    while (walker.nextNode()) texts.push(walker.currentNode)
    return texts
  }

  // Where the keywords come in a text, merged where they overlap.
  function rangesOf(text) {
    const lower = text.toLowerCase()
    const found = []
    for (const keyword of keywords) {
      for (
        let at = lower.indexOf(keyword);
        at !== -1;
        at = lower.indexOf(keyword, at + 1)
      ) {
        found.push([at, at + keyword.length])
      }
    }
    found.sort((a, b) => a[0] - b[0])
    return found.reduce((merged, range) => {
      const last = merged[merged.length - 1]
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
      else merged.push(range)
      return merged
    }, [])
  }

  // The contents' targets (section wrappers and headings), in page order.
  function targets() {
    if (!toc) return []
    return Array.from(toc.querySelectorAll('[data-guide-toc-target]'))
      .map((link) => ({
        link,
        element: document.getElementById(
          link.getAttribute('data-guide-toc-target')
        )
      }))
      .filter((target) => target.element)
  }

  // The contents links for a match: its section's, and the heading's it
  // comes under (a section's lead part, or a part).
  function linksFor(node, all) {
    const section = node.parentElement.closest('.app-guide-section')
    let heading = null
    for (const target of all) {
      const position = target.element.compareDocumentPosition(node)
      if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) continue
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) heading = target
      else break
    }
    const sectionTarget =
      section && all.find((target) => target.element === section)
    return { section: sectionTarget, heading }
  }

  function find() {
    const all = targets()
    const found = []
    for (const root of roots()) {
      for (const text of textsIn(root)) {
        for (const [start, end] of rangesOf(text.data)) {
          const range = document.createRange()
          range.setStart(text, start)
          range.setEnd(text, end)
          found.push({ range, ...linksFor(text, all) })
        }
      }
    }
    return found
  }

  function paint() {
    if (!highlights) return
    highlights.delete('guide-keyword-match')
    highlights.delete('guide-keyword-current')
    if (!matches.length) return
    highlights.set(
      'guide-keyword-match',
      new Highlight(...matches.map((match) => match.range))
    )
    if (matches[current]) {
      const highlight = new Highlight(matches[current].range)
      highlight.priority = 1
      highlights.set('guide-keyword-current', highlight)
    }
  }

  function markContents() {
    if (!toc) return
    const marked = new Set()
    for (const match of matches) {
      if (match.section) marked.add(match.section.link)
      if (match.heading) marked.add(match.heading.link)
    }
    toc.querySelectorAll('[data-guide-toc-target]').forEach((link) => {
      link.classList.toggle(MATCH_CLASS, marked.has(link))
    })
  }

  function sectionCount() {
    return new Set(
      matches.map((match) => (match.heading || match.section || {}).link)
    ).size
  }

  function describe() {
    if (!keywords.length) return ''
    if (!matches.length) return 'No matches for ' + input.value.trim()
    const sections = sectionCount()
    return (
      'Match ' +
      (current + 1) +
      ' of ' +
      matches.length +
      ', in ' +
      sections +
      (sections === 1 ? ' section' : ' sections')
    )
  }

  // A stepper page other than the one shown holds the match: show it.
  function revealPage(node) {
    const page = node.parentElement.closest('[data-guide-page]')
    if (page && page.hasAttribute('hidden')) {
      page.dispatchEvent(new CustomEvent('guide-pages:show'))
    }
  }

  // Out of sight, the match comes into view below the search box, with the
  // heading it comes under at the top when both fit, else in the middle.
  function bringIntoView(match) {
    const top = form.offsetHeight + MARGIN
    const bottom = window.innerHeight - MARGIN
    const box = match.range.getBoundingClientRect()
    if (box.top >= top && box.bottom <= bottom) return

    const heading = match.heading && match.heading.element
    const toHeading = heading ? heading.getBoundingClientRect().top - top : null
    const toMiddle = (box.top + box.bottom) / 2 - (top + bottom) / 2
    const fits =
      toHeading !== null &&
      toHeading <= box.top - top &&
      box.bottom - toHeading <= bottom
    window.scrollBy(0, fits ? toHeading : toMiddle)
  }

  // The contents scroll by themselves: keep the match's entry in sight.
  function keepEntryInView(match) {
    const target = match.heading || match.section
    if (!toc || !target) return
    const box = toc.getBoundingClientRect()
    const rect = target.link.getBoundingClientRect()
    const above = Math.min(rect.top - box.top, 0)
    const below = Math.max(rect.bottom - box.bottom, 0)
    toc.scrollTop += above || below
  }

  function show(index) {
    current = index
    const match = matches[current]
    revealPage(match.range.startContainer)
    paint()
    bringIntoView(match)
    keepEntryInView(match)
    status.textContent = describe()

    // For guide-toc.js, which marks where the reader is.
    document.dispatchEvent(
      new CustomEvent('guide-keyword-search:match', {
        detail: {
          range: match.range,
          link: (match.heading || match.section || {}).link
        }
      })
    )
  }

  function search(back) {
    keywords = keywordsOf(input.value)
    searched = keywords.join(' ')
    matches = keywords.length ? find() : []
    current = -1
    markContents()
    paint()
    status.textContent = describe()
    if (matches.length) show(back ? matches.length - 1 : 0)
    else
      document.dispatchEvent(
        new CustomEvent('guide-keyword-search:match', { detail: {} })
      )
  }

  function move(back) {
    if (!matches.length) return
    const next = current + (back ? -1 : 1)
    show((next + matches.length) % matches.length)
  }

  function go(back) {
    if (keywordsOf(input.value).join(' ') === searched && searched) move(back)
    else search(back)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    go(false)
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      go(true)
    }
  })

  // The TipTap viewer replaces a part's text once it loads, leaving the
  // ranges pointing at nothing: find the matches again, keeping the place.
  let refinding = false
  const observer = new MutationObserver(() => {
    if (!keywords.length || refinding) return
    refinding = true
    window.requestAnimationFrame(() => {
      refinding = false
      const place = current
      matches = find()
      current = Math.min(place, matches.length - 1)
      markContents()
      paint()
      status.textContent = describe()
    })
  })
  roots().forEach((root) =>
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    })
  )

  // The contents stay in view below the search box, and jump links land
  // below it, so the stylesheet needs its height.
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        '--app-guide-keyword-search-height',
        form.offsetHeight + 'px'
      )
    }).observe(form)
  }
})()
