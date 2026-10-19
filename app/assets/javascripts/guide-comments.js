//
// A guide's quality check comments, shown like Word's: each comment in its
// own box in a column beside the text, level with the text it is about,
// which is highlighted. Opened from the checks widget's "View issues" once
// it has a real check (partials/checks-widget-script.njk), it takes the
// place of the guide details panel until closed.
//
// The comments come from the PoC API's latest quality check of the guide,
// through this prototype's /playground/guide/:id/quality-check. Each anchors
// its quote in Markdown, with a little Markdown either side. The quote is
// turned to plain text and found in the text shown: the stepper page shown,
// or the whole guide in the traditional format. Spacing, case, curly quotes
// and dashes are ignored, and the Markdown either side picks between
// repeats. A comment on an image outlines the image.
//
// The highlights are painted with the CSS Custom Highlight API, as the
// keyword search's are (guide-keyword-search.js), so the TipTap viewer's
// own DOM is never changed. Resolved and Won't fix are remembered in this
// browser only.
//
;(function () {
  const column = document.querySelector('[data-guide-comments]')
  if (!column) return

  const track = column.querySelector('[data-guide-comments-track]')
  const unplacedList = column.querySelector('[data-guide-comments-unplaced]')
  const panel = document.querySelector('.app-guide-panel')
  const panelHandle = document.querySelector('.app-shell__resize--aside')
  const highlights = window.CSS && CSS.highlights
  const desktop = window.matchMedia('(min-width: 769px)')

  // Room between boxes, and between a highlight brought into view and the
  // top of the window.
  const GAP = 8
  const MARGIN = 80

  const OPEN_KEY = 'guide-comments-open:' + window.location.pathname
  const STATUS_KEY = 'guide-comment-status:'

  const RULE_NAMES = {
    'GM-Qual-01': 'Active voice',
    'GM-Qual-02': 'Plain English',
    'GM-Qual-04': 'Sentence length',
    'GM-Qual-05': 'One idea per paragraph',
    'GM-Qual-06': 'Steps and background',
    'GM-Qual-07': 'Specialist terms',
    'GM-Qual-08': 'No Latin',
    'GM-Qual-09': 'Ampersands',
    'GM-Qual-10': 'Dashes',
    'GM-Qual-11': 'Heading case',
    'GM-Qual-12': 'Capital letters',
    'GM-Qual-13': 'Numbers',
    'GM-Qual-14': 'Link text',
    'GM-Qual-17': 'Task-focused steps',
    'GM-Qual-18': 'Alternative text and images',
    'GM-Qual-20': 'Heading order',
    'GM-Qual-23': 'UK spelling',
    'GM-Qual-24': 'Grammar',
    'GM-Qual-25': 'Italics',
    'GM-Qual-26': 'Links outside sentences',
    'GM-Qual-28': 'Slashes'
  }

  // Text that isn't the guide's own, and elements that start a new line:
  // the same as the keyword search's.
  const SKIP =
    'script, style, .app-guide-section-bookmark, .app-guide-section-bookmarked, .govuk-visually-hidden, [aria-hidden="true"]'

  const FOLDS = {
    '‘': "'",
    '’': "'",
    '‚': "'",
    '‛': "'",
    '“': '"',
    '”': '"',
    '„': '"',
    '‟': '"',
    '–': '-',
    '—': '-',
    '‒': '-',
    '−': '-',
    '￼': ''
  }

  // A character as it is compared: '' for one that is never compared.
  function fold(character) {
    if (character in FOLDS) return FOLDS[character]
    if (character.trim() === '') return ''
    return character.toLowerCase()
  }

  function foldAll(text) {
    let folded = ''
    for (const character of text) folded += fold(character)
    return folded
  }

  // The words a reader sees for a piece of Markdown.
  function plainText(markdown) {
    return markdown
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/^\s*#+\s/gm, '')
      .replace(/^\s*(?:[-*+]|\d+\.)\s/gm, '')
      .replace(/[*_|\\]/g, '')
  }

  // The asset an image quote shows, if the quote is an image.
  function imageAsset(markdown) {
    const start = markdown.indexOf('![')
    if (start === -1) return null
    const path = markdown.slice(markdown.indexOf('(', start) + 1).split(')')[0]
    return path.split('/').pop() || null
  }

  // The guide's text shown now: the stepper page shown, or every section.
  function visibleRoots() {
    const sections = Array.from(document.querySelectorAll('.app-guide-section'))
    const roots = sections.length
      ? sections
      : Array.from(
          document.querySelectorAll('.app-guide-columns > .app-guide-markdown')
        )
    return roots.filter((root) => !root.closest('[hidden]'))
  }

  // The visible text, folded, with the text node and offset each character
  // came from.
  function indexText(roots) {
    let text = ''
    const places = []
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.parentElement.closest(SKIP)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT
      })
      while (walker.nextNode()) {
        const node = walker.currentNode
        for (let offset = 0; offset < node.data.length; offset++) {
          const folded = fold(node.data[offset])
          for (const character of folded) {
            text += character
            places.push({ node, offset })
          }
        }
      }
    }
    return { text, places }
  }

  function everyIndexOf(text, part) {
    const found = []
    let at = text.indexOf(part)
    while (at !== -1) {
      found.push(at)
      at = text.indexOf(part, at + 1)
    }
    return found
  }

  // How many characters at the end of `a` match the end of `b`.
  function sharedEnd(a, b) {
    let count = 0
    while (
      count < a.length &&
      count < b.length &&
      a[a.length - 1 - count] === b[b.length - 1 - count]
    ) {
      count++
    }
    return count
  }

  function sharedStart(a, b) {
    let count = 0
    while (count < a.length && count < b.length && a[count] === b[count]) {
      count++
    }
    return count
  }

  // Where a comment's quote is in the visible text: a Range, or an image.
  function locate(comment, index, roots) {
    const anchor = comment.anchor
    const asset = imageAsset(anchor.exact)
    const exact = foldAll(plainText(anchor.exact))

    if (!exact && asset) {
      const image = roots
        .flatMap((root) => Array.from(root.querySelectorAll('img')))
        .find((candidate) => candidate.src.indexOf(asset) !== -1)
      return image ? { image } : null
    }
    if (!exact) return null

    const prefix = foldAll(plainText(anchor.prefix))
    const suffix = foldAll(plainText(anchor.suffix))
    const starts = everyIndexOf(index.text, exact)
    if (!starts.length) return null

    const score = (start) =>
      sharedEnd(
        prefix,
        index.text.slice(Math.max(0, start - prefix.length), start)
      ) + sharedStart(suffix, index.text.slice(start + exact.length))
    const start = starts.reduce((best, candidate) =>
      score(candidate) > score(best) ? candidate : best
    )

    const first = index.places[start]
    const last = index.places[start + exact.length - 1]
    const range = document.createRange()
    range.setStart(first.node, first.offset)
    range.setEnd(last.node, last.offset + 1)
    return { range }
  }

  // ---------------------------------------------------------------------

  let comments = []
  let placed = []
  let unplaced = []
  let selected = null
  let layout = new Map()
  let frame = null

  function statusOf(comment) {
    try {
      return window.localStorage.getItem(STATUS_KEY + comment.commentId)
    } catch (e) {
      return null
    }
  }

  function setStatus(comment, status) {
    try {
      if (status) {
        window.localStorage.setItem(STATUS_KEY + comment.commentId, status)
      } else {
        window.localStorage.removeItem(STATUS_KEY + comment.commentId)
      }
    } catch (e) {}
  }

  function topOf(place) {
    const rect = place.range
      ? place.range.getClientRects()[0] || place.range.getBoundingClientRect()
      : place.image.getBoundingClientRect()
    return rect.top + window.scrollY
  }

  function paint() {
    if (!highlights) return
    const groups = { normal: [], resolved: [], 'wont-fix': [], selected: [] }
    for (const item of placed) {
      if (!item.place.range) continue
      const group =
        item === selected ? 'selected' : statusOf(item.comment) || 'normal'
      groups[group].push(item.place.range)
    }
    highlights.set('guide-comment', new Highlight(...groups.normal))
    highlights.set('guide-comment-resolved', new Highlight(...groups.resolved))
    highlights.set(
      'guide-comment-wont-fix',
      new Highlight(...groups['wont-fix'])
    )
    highlights.set('guide-comment-selected', new Highlight(...groups.selected))

    for (const item of placed) {
      if (!item.place.image) continue
      item.place.image.classList.add('app-guide-comment-image')
      item.place.image.classList.toggle(
        'app-guide-comment-image--selected',
        item === selected
      )
    }
  }

  function unpaint() {
    if (highlights) {
      ;[
        'guide-comment',
        'guide-comment-resolved',
        'guide-comment-wont-fix',
        'guide-comment-selected'
      ].forEach((name) => highlights.delete(name))
    }
    document.querySelectorAll('.app-guide-comment-image').forEach((image) => {
      image.classList.remove(
        'app-guide-comment-image',
        'app-guide-comment-image--selected'
      )
    })
  }

  function button(text, classes, onClick) {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'govuk-button govuk-!-margin-bottom-0 ' + classes
    element.textContent = text
    element.addEventListener('click', (event) => {
      event.stopPropagation()
      onClick()
    })
    return element
  }

  function paragraph(text, className) {
    const element = document.createElement('p')
    element.className = className
    element.textContent = text
    return element
  }

  function buildBox(item) {
    const comment = item.comment
    const box = document.createElement('div')
    box.className = 'app-guide-comment'
    box.tabIndex = 0
    box.setAttribute('role', 'group')
    box.setAttribute(
      'aria-label',
      'Comment on section ' + comment.section + ': ' + comment.issue
    )

    const rule = RULE_NAMES[comment.ruleId]
    box.append(
      paragraph(
        comment.ruleId + (rule ? ' ' + rule : '') + ' · ' + comment.section,
        'app-guide-comment__rule'
      ),
      paragraph(comment.issue, 'app-guide-comment__issue'),
      paragraph(comment.whyItMatters, 'app-guide-comment__why'),
      paragraph(
        'Suggested change: ' + comment.recommendation,
        'app-guide-comment__recommendation'
      )
    )

    const actions = document.createElement('div')
    actions.className = 'app-guide-comment__actions govuk-button-group'
    box.append(actions)

    box.addEventListener('click', () => select(item, 'comment'))
    box.addEventListener('keydown', (event) => {
      if (
        event.target === box &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault()
        select(item, 'comment')
      }
    })

    item.box = box
    item.actions = actions
    return box
  }

  // Each box's look, and the buttons only the selected one shows.
  function refreshBoxes() {
    for (const item of placed.concat(unplaced)) {
      const status = statusOf(item.comment)
      item.box.classList.toggle(
        'app-guide-comment--selected',
        item === selected
      )
      item.box.classList.toggle(
        'app-guide-comment--resolved',
        status === 'resolved'
      )
      item.box.classList.toggle(
        'app-guide-comment--wont-fix',
        status === 'wont-fix'
      )
      item.actions.replaceChildren()
      if (item !== selected) continue

      const change = (next) => () => {
        setStatus(item.comment, next)
        refreshBoxes()
        paint()
      }
      if (status) {
        item.actions.append(
          button('Redress', 'govuk-button--secondary', change(null))
        )
      } else {
        item.actions.append(
          button('Resolved', '', change('resolved')),
          button("Won't fix", 'govuk-button--secondary', change('wont-fix'))
        )
      }
    }
  }

  // Where each box goes, in page coordinates: level with its highlight's
  // first line if there is room, otherwise just below the box before it.
  // The selected box always sits level with its highlight, and the boxes
  // before it move up to make room.
  function arrange() {
    layout = new Map()
    if (!desktop.matches) {
      spacer.style.height = '0px'
      return
    }

    const wanted = placed.map((item) => topOf(item.place))
    const heights = placed.map((item) => item.box.offsetHeight)
    const tops = []
    wanted.forEach((top, i) => {
      tops[i] =
        i === 0 ? top : Math.max(top, tops[i - 1] + heights[i - 1] + GAP)
    })

    const chosen = placed.indexOf(selected)
    if (chosen !== -1) {
      tops[chosen] = wanted[chosen]
      for (let i = chosen + 1; i < placed.length; i++) {
        tops[i] = Math.max(wanted[i], tops[i - 1] + heights[i - 1] + GAP)
      }
      for (let i = chosen - 1; i >= 0; i--) {
        tops[i] = Math.min(tops[i], tops[i + 1] - heights[i] - GAP)
      }
    }

    placed.forEach((item, i) => layout.set(item, tops[i]))
    makeRoom(tops, heights)
  }

  // The page must scroll far enough to bring the last box into view, above
  // the footer, even when its highlight is on the guide's last line. The
  // column ends where the shell (the area above the footer) ends, so a
  // spacer after the guide makes the shell reach past the last box.
  const spacer = document.createElement('div')
  spacer.setAttribute('aria-hidden', 'true')
  spacer.className = 'app-guide-comments-spacer'

  function makeRoom(tops, heights) {
    const reading = document.querySelector('.app-guide-reading')
    if (!spacer.isConnected) reading.after(spacer)
    spacer.style.height = '0px'
    if (!placed.length) return

    const last = placed.length - 1
    const boxesEnd = tops[last] + heights[last] + GAP
    const shell = reading.closest('.app-shell') || reading.parentElement
    const shellEnd = shell.getBoundingClientRect().bottom + window.scrollY
    spacer.style.height = Math.max(0, Math.ceil(boxesEnd - shellEnd)) + 'px'
  }

  // Scrolls just enough to show the whole of a box, if it runs off the
  // bottom of the window.
  function showWholeBox(item) {
    const bottom = layout.get(item) - window.scrollY + item.box.offsetHeight
    const overflow = bottom - (window.innerHeight - GAP)
    if (overflow > 0) {
      window.scrollTo({ top: window.scrollY + overflow, behavior: 'smooth' })
    }
  }

  // Moves the boxes with the page: the column stays put as it scrolls.
  function position() {
    frame = null
    if (!desktop.matches) {
      placed.forEach((item) => {
        item.box.style.transform = ''
      })
      return
    }
    const trackTop = track.getBoundingClientRect().top
    for (const item of placed) {
      const top = layout.get(item) - window.scrollY - trackTop
      item.box.style.transform = 'translateY(' + Math.round(top) + 'px)'
    }
  }

  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(position)
  }

  // Keeps a highlight in the window, near its top, if it is out of view;
  // otherwise shows the whole of its box.
  function bringIntoView(item) {
    const top = topOf(item.place) - window.scrollY
    if (top < MARGIN || top > window.innerHeight - MARGIN) {
      window.scrollTo({ top: topOf(item.place) - MARGIN, behavior: 'smooth' })
    } else {
      showWholeBox(item)
    }
  }

  function select(item, from) {
    selected = item
    refreshBoxes()
    paint()
    arrange()
    position()
    if (from === 'comment' && item.place) bringIntoView(item)
    if (from === 'text') {
      item.box.focus({ preventScroll: true })
      showWholeBox(item)
    }
  }

  // Finds every comment's place in the text shown and lays out the boxes.
  function place() {
    const roots = visibleRoots()
    const index = indexText(roots)
    const stepper = Boolean(document.querySelector('[data-guide-page]'))

    placed = []
    unplaced = []
    for (const comment of comments) {
      const found = locate(comment, index, roots)
      const item = { comment, place: found }
      if (found) {
        placed.push(item)
      } else if (!stepper) {
        // In the stepper a comment not on this page is on another one.
        unplaced.push(item)
      }
    }
    placed.forEach((item) => {
      item.top = topOf(item.place)
    })
    placed.sort((a, b) => a.top - b.top)
    // A new layout makes new items: the selection is kept by comment.
    const selectedId = selected && selected.comment.commentId
    selected =
      placed.find((item) => item.comment.commentId === selectedId) || null

    track.replaceChildren(...placed.map(buildBox))
    unplacedList.replaceChildren()
    if (unplaced.length) {
      const details = document.createElement('details')
      details.className = 'govuk-details govuk-!-margin-bottom-2'
      const summary = document.createElement('summary')
      summary.className = 'govuk-details__summary'
      summary.innerHTML =
        '<span class="govuk-details__summary-text">' +
        unplaced.length +
        ' not found in the text</span>'
      const body = document.createElement('div')
      body.className = 'govuk-details__text app-guide-comments__unplaced'
      body.append(...unplaced.map(buildBox))
      details.append(summary, body)
      unplacedList.append(details)
    }

    refreshBoxes()
    paint()
    arrange()
    position()
  }

  // A click in the text on a highlight selects its comment.
  function commentAt(event) {
    const image = event.target.closest('img')
    if (image) {
      return placed.find((item) => item.place.image === image) || null
    }
    const caret = document.caretPositionFromPoint
      ? document.caretPositionFromPoint(event.clientX, event.clientY)
      : document.caretRangeFromPoint(event.clientX, event.clientY)
    if (!caret) return null
    const node = caret.offsetNode || caret.startContainer
    const offset = caret.offset !== undefined ? caret.offset : caret.startOffset
    return (
      placed.find(
        (item) =>
          item.place.range && item.place.range.comparePoint(node, offset) === 0
      ) || null
    )
  }

  function onTextClick(event) {
    const item = commentAt(event)
    if (item) select(item, 'text')
  }

  let resizeTimer = null
  const observer = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(place, 150)
  })

  function open(check) {
    comments = check.comments || []
    column.hidden = false
    if (panel) panel.hidden = true
    if (panelHandle) panelHandle.hidden = true
    try {
      window.sessionStorage.setItem(OPEN_KEY, '1')
    } catch (e) {}

    place()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document
      .querySelector('.app-guide-reading')
      .addEventListener('click', onTextClick)
    observer.observe(document.querySelector('.app-guide-reading'))
  }

  function close() {
    spacer.remove()
    column.hidden = true
    if (panel) panel.hidden = false
    if (panelHandle) panelHandle.hidden = false
    try {
      window.sessionStorage.removeItem(OPEN_KEY)
    } catch (e) {}

    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    document
      .querySelector('.app-guide-reading')
      .removeEventListener('click', onTextClick)
    observer.disconnect()
    unpaint()
    track.replaceChildren()
    unplacedList.replaceChildren()
    comments = []
    placed = []
    unplaced = []
    selected = null
  }

  function load() {
    return window
      .fetch(column.dataset.qualityCheckHref, {
        headers: { Accept: 'application/json' }
      })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  }

  column
    .querySelector('[data-guide-comments-close]')
    .addEventListener('click', close)

  // The checks widget's "View issues", once it has a real check.
  document.addEventListener('app:show-guide-comments', () => {
    load().then((check) => {
      if (check) open(check)
    })
  })

  // Stepper pages are separate loads: the comments stay open across them.
  let reopen = false
  try {
    reopen = window.sessionStorage.getItem(OPEN_KEY) === '1'
  } catch (e) {}
  if (reopen) {
    window.addEventListener('load', () => {
      load().then((check) => {
        if (check) open(check)
      })
    })
  }
})()
