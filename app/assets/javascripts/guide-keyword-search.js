//
// Search for keywords in the guide on the page (guide/page.njk): one word as a
// whole word, several as that whole phrase, in any case (keyword-matches.js,
// shared with the hub's search of every guide). Ctrl+F (Cmd+F) comes to the
// box. Enter highlights every match and, in the contents, every section and
// part with one, and brings the first into view; Enter again goes to the next,
// Shift+Enter to the one before, round at either end.
//
// Matches are painted with the CSS Custom Highlight API rather than <mark>
// elements, so the TipTap viewer's DOM is never touched. In the stepper
// every page is in the HTML (reading-content.njk), so a match on another
// page shows that page, as the browser's find does (guide-pages.js).
//
// A page opened with words in the box (?keywords=, from a hub result) searches
// for them at once, from the first match in the section or part it opened at.
//
;(function () {
  const form = document.querySelector('[data-guide-keyword-search]')
  if (!form) return

  const { searchTermOf, matchesIn } = window.appKeywordMatches
  const input = form.querySelector('input')
  const status = form.querySelector('[data-guide-keyword-search-status]')
  const results = form.querySelector('[data-guide-keyword-search-results]')
  const controls = form.querySelector('[data-guide-keyword-search-controls]')
  const position = form.querySelector('[data-guide-keyword-search-position]')
  const toc = document.querySelector('[data-guide-toc]')
  const highlights = window.CSS && CSS.highlights

  // Room between a match brought into view and the edges of the window.
  const MARGIN = 16
  // While a search has matches, the contents fade the entries with none and
  // give each other entry a count of the matches under it.
  const SEARCHING_CLASS = 'app-guide-contents--searching'
  const MATCH_CLASS = 'app-guide-contents__link--match'
  const COUNTED_CLASS = 'app-guide-contents__entry--counted'

  // Text that isn't the guide's own: bookmark controls, hidden labels and
  // the TipTap viewer's Markdown source.
  const SKIP =
    'script, style, .app-guide-section-bookmark, .app-guide-section-bookmarked, .govuk-visually-hidden, [aria-hidden="true"]'

  // Elements that start a new line: a phrase runs across bold or a link, but
  // not from one of these into the next. The break is neither space nor word.
  const BLOCKS =
    'p, li, h1, h2, h3, h4, h5, h6, td, th, dt, dd, caption, figcaption, blockquote, pre, section, div, ul, ol, table, tr'
  const BLOCK_BREAK = '\u0000'

  let searched = ''
  let matches = []
  let current = -1
  // Where a page opened with a search starts, until the reader moves on.
  let startAt = null

  // Ctrl+F (Cmd+F on a Mac) searches this guide, not just the page shown.
  input.setAttribute('aria-keyshortcuts', 'Control+F Meta+F')

  // The box shows its shortcut, as the all-guidance search shows Ctrl K.
  const kbd = document.createElement('kbd')
  kbd.className = 'app-search-kbd'
  kbd.setAttribute('aria-hidden', 'true')
  kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform)
    ? '\u2318 F'
    : 'Ctrl F'
  input.after(kbd)
  document.addEventListener('keydown', (event) => {
    const modified = event.ctrlKey || event.metaKey
    if (!modified || event.altKey || event.key.toLowerCase() !== 'f') return
    event.preventDefault()
    input.focus()
    input.select()
  })

  // The guide's text: every section (every stepper page's too), or a guide
  // without sections as one block.
  function roots() {
    const sections = document.querySelectorAll('.app-guide-section')
    return sections.length
      ? Array.from(sections)
      : Array.from(
          document.querySelectorAll('.app-guide-columns > .app-guide-markdown')
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

  // A root's text as one string, a break between blocks, with where each
  // text node starts in it, so a match can cross bold or a link.
  function textOf(root) {
    const pieces = []
    let text = ''
    let lastBlock = null

    for (const node of textsIn(root)) {
      const block = node.parentElement.closest(BLOCKS)
      if (text && block !== lastBlock) text += BLOCK_BREAK
      pieces.push({ node, start: text.length })
      text += node.data
      lastBlock = block
    }

    return { text, pieces }
  }

  // The text node and offset at a place in textOf's string. An end place
  // belongs to the node it ends in, not the one starting there.
  function pointAt(pieces, place, isEnd) {
    const piece = pieces.findLast((candidate) =>
      isEnd ? candidate.start < place : candidate.start <= place
    )
    return { node: piece.node, offset: place - piece.start }
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
  // comes under: the last target before it or holding it, so a match in a
  // section's opening text comes under that section, not the one before.
  function linksFor(node, all) {
    const section = node.parentElement.closest('.app-guide-section')
    let heading = null
    for (const target of all) {
      const position = target.element.compareDocumentPosition(node)
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
      const { text, pieces } = textOf(root)
      for (const [start, end] of matchesIn(text, searched)) {
        const from = pointAt(pieces, start, false)
        const to = pointAt(pieces, end, true)
        const range = document.createRange()
        range.setStart(from.node, from.offset)
        range.setEnd(to.node, to.offset)
        found.push({ range, ...linksFor(from.node, all) })
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
    // Each match counts once, for the entry it comes under: the heading's,
    // else its section's.
    const counts = new Map()
    for (const match of matches) {
      const link = (match.heading || match.section || {}).link
      if (link) counts.set(link, (counts.get(link) || 0) + 1)
    }

    toc.classList.toggle(SEARCHING_CLASS, counts.size > 0)
    toc.querySelectorAll('.app-guide-contents__count').forEach((badge) => {
      badge.parentElement.classList.remove(COUNTED_CLASS)
      badge.remove()
    })
    toc.querySelectorAll('[data-guide-toc-target]').forEach((link) => {
      const count = counts.get(link) || 0
      link.classList.toggle(MATCH_CLASS, count > 0)
      if (!count) return

      const badge = document.createElement('span')
      badge.className = 'app-guide-contents__count'
      badge.textContent = count
      const label = document.createElement('span')
      label.className = 'govuk-visually-hidden'
      label.textContent = count === 1 ? ' match' : ' matches'
      badge.append(label)
      link.parentElement.classList.add(COUNTED_CLASS)
      link.after(badge)
    })
  }

  function sectionCount() {
    return new Set(
      matches.map((match) => (match.heading || match.section || {}).link)
    ).size
  }

  // Once searched: how many matches in how many sections, and, with any,
  // Previous and Next and which match is shown.
  function render() {
    results.hidden = !searched
    if (!searched) return

    controls.hidden = !matches.length
    if (!matches.length) {
      status.textContent = 'No matches for ' + input.value.trim()
      return
    }
    const sections = sectionCount()
    status.textContent =
      matches.length +
      (matches.length === 1 ? ' match' : ' matches') +
      ' in ' +
      sections +
      (sections === 1 ? ' section' : ' sections')
    position.textContent =
      current === -1 ? '' : 'Match ' + (current + 1) + ' of ' + matches.length
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
    render()

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

  // On a page opened with a search, the first match at or after the anchor it
  // opened at (a part's heading, or its section); otherwise the first match,
  // or, going back, the last.
  function startingMatch(back) {
    const anchor = startAt && document.getElementById(startAt)
    const after =
      Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY
    const index = anchor
      ? matches.findIndex(
          (match) =>
            anchor.compareDocumentPosition(match.range.startContainer) & after
        )
      : -1
    if (index !== -1) return index
    return back ? matches.length - 1 : 0
  }

  function search(back) {
    searched = searchTermOf(input.value)
    matches = searched ? find() : []
    current = -1
    markContents()
    paint()
    render()
    if (matches.length) show(startingMatch(back))
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
    startAt = null
    const term = searchTermOf(input.value)
    if (term && term === searched) move(back)
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

  // Previous and Next do what Shift+Enter and Enter do in the box.
  controls.addEventListener('click', (event) => {
    const step = event.target.closest('[data-guide-keyword-search-step]')
    if (!step) return
    startAt = null
    move(step.dataset.guideKeywordSearchStep === 'previous')
  })

  // A clear button in the box once it has text, in place of its shortcut.
  const clear = document.createElement('button')
  clear.type = 'button'
  clear.className = 'app-guide-keyword-search__clear'
  clear.setAttribute('aria-label', 'Clear search')
  clear.textContent = '\u00d7'
  kbd.after(clear)

  function showClear() {
    const hasText = Boolean(input.value)
    clear.hidden = !hasText
    kbd.hidden = hasText
  }

  clear.addEventListener('click', () => {
    input.value = ''
    searched = ''
    matches = []
    current = -1
    startAt = null
    markContents()
    paint()
    render()
    showClear()
    document.dispatchEvent(
      new CustomEvent('guide-keyword-search:match', { detail: {} })
    )
    input.focus()
  })

  input.addEventListener('input', showClear)
  showClear()

  // The TipTap viewer replaces a part's text once it loads, leaving the
  // ranges pointing at nothing: find the matches again, keeping the place,
  // or, on a page opened with a search, starting again where it opened.
  let refinding = false
  const observer = new MutationObserver(() => {
    if (!searched || refinding) return
    refinding = true
    window.requestAnimationFrame(() => {
      refinding = false
      const place = current
      matches = find()
      markContents()
      if (startAt && matches.length) {
        show(startingMatch(false))
        return
      }
      current = Math.min(place, matches.length - 1)
      paint()
      render()
    })
  })
  roots().forEach((root) =>
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    })
  )

  // Opened with a search. Until the page loads, the browser keeps jumping to
  // the address's #anchor, and the jump takes focus from the box (a section
  // can't take it), so refocus once it's done. Lazy images then change the
  // page's height, so keep the match in view until the reader moves on.
  if (input.value.trim()) {
    startAt = decodeURIComponent(location.hash.slice(1)) || null
    input.focus({ preventScroll: true })
    search(false)

    const keepInView = () => {
      if (startAt && matches[current]) bringIntoView(matches[current])
    }
    const movedOn = () => {
      startAt = null
    }
    for (const type of ['wheel', 'touchstart', 'mousedown', 'keydown']) {
      window.addEventListener(type, movedOn, { once: true, capture: true })
    }
    if (window.ResizeObserver) {
      new ResizeObserver(keepInView).observe(document.body)
    }
    if (document.readyState !== 'complete') {
      window.addEventListener(
        'load',
        () =>
          setTimeout(() => {
            input.focus({ preventScroll: true })
            keepInView()
          }, 0),
        { once: true }
      )
    }
  }
})()
