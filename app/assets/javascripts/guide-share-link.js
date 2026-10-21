//
// The sharing link in a guide's left margin (playground/guide/page.njk).
// It follows the pointer: centred in the margin, level with the first line
// of whichever block (paragraph, list item, heading, table row, image) the
// pointer is over, and it keeps following while the pointer is in the
// margin, so it can be reached. Its tooltip says "Click to copy sharing
// link"; a click copies it and says "Copied to clipboard" until the pointer
// moves to another block.
//
// The link goes to the block's section (guide/section/, which finds the
// right stepper page) with a URL text fragment for the block's own text.
//
;(function () {
  const button = document.querySelector('[data-guide-share-link]')
  if (!button) return

  const name = button.querySelector('[data-guide-share-link-name]')
  const tooltip = button.querySelector('[data-guide-share-link-tooltip]')
  const status = document.querySelector('[data-guide-share-link-status]')
  const sectionHref = button.getAttribute('data-section-href')

  // A guide's sections, or a converted guide's whole text when it has none.
  const SCOPES = '.app-guide-section, .app-guide-markdown'
  const BLOCKS =
    'h1, h2, h3, h4, h5, h6, p, li, tr, figure, img, pre, blockquote, dt, dd'
  // Text the hub puts into the guide, not the guide's own: no link to it.
  const NOT_GUIDE_TEXT = '.app-guide-section-bookmarked'
  const SIZE = 36
  const WORDS_EACH_END = 4

  const LABELS = {
    copy: 'Click to copy sharing link',
    copied: 'Copied to clipboard'
  }

  // Positioned against the page, not whatever wraps the guide.
  document.body.appendChild(button)

  let current = null

  function setLabel(label) {
    name.textContent = LABELS[label]
    tooltip.textContent = LABELS[label]
  }

  // The margin to the left of the guide's text: from the Contents column's
  // right edge when it sits beside the guide, else the reading column's.
  function marginOf(scope) {
    const contentLeft = scope.getBoundingClientRect().left
    const contents = document.querySelector('.app-guide-contents')
    const beside = contents && contents.getBoundingClientRect()
    const reading = document.querySelector('.app-guide-reading')
    const outer =
      beside && beside.width && beside.right <= contentLeft
        ? beside.right
        : reading.getBoundingClientRect().left
    return { left: outer, right: contentLeft }
  }

  function firstLineHeight(block) {
    const style = window.getComputedStyle(block)
    const height = parseFloat(style.lineHeight)
    return Number.isFinite(height) ? height : parseFloat(style.fontSize) * 1.2
  }

  function place(block) {
    const scope = block.closest(SCOPES)
    const margin = marginOf(scope)
    const box = block.getBoundingClientRect()
    const centre =
      margin.right - margin.left >= SIZE + 8
        ? (margin.left + margin.right) / 2
        : margin.right - SIZE / 2 - 4
    const lineMiddle =
      block.tagName === 'IMG' || block.tagName === 'FIGURE'
        ? box.top + SIZE / 2
        : box.top + Math.min(firstLineHeight(block), box.height) / 2
    button.style.left = `${centre - SIZE / 2 + window.scrollX}px`
    button.style.top = `${lineMiddle - SIZE / 2 + window.scrollY}px`
    button.hidden = false
  }

  function blockAt(element) {
    const block = element && element.closest(BLOCKS)
    if (!block || block.closest(NOT_GUIDE_TEXT)) return null
    return block.closest(SCOPES) ? block : null
  }

  function show(block) {
    if (block !== current) {
      current = block
      setLabel('copy')
    }
    place(block)
  }

  function hide() {
    if (button.matches(':hover')) return
    button.hidden = true
    current = null
  }

  function firstVisibleScope() {
    return Array.from(document.querySelectorAll(SCOPES)).find(
      (scope) => scope.getClientRects().length
    )
  }

  // In the margin, the block level with the pointer; null outside it. Over
  // the gap between two blocks, the one already marked stays.
  function blockInMargin(event) {
    const scope = (current && current.closest(SCOPES)) || firstVisibleScope()
    if (!scope) return null
    const margin = marginOf(scope)
    if (event.clientX < margin.left || event.clientX >= margin.right) {
      return null
    }
    const level = document.elementFromPoint(margin.right + 12, event.clientY)
    if (!level || !level.closest(SCOPES)) return null
    return blockAt(level) || current
  }

  // Follows the pointer over the guide's text and in its left margin.
  document.addEventListener('mousemove', (event) => {
    if (button.contains(event.target)) return
    const inText = event.target.closest(SCOPES)
    const block =
      blockAt(event.target) || (inText ? current : null) || blockInMargin(event)
    if (block) show(block)
    else hide()
  })

  document.documentElement.addEventListener('mouseleave', hide)

  // The section a block is in: its own anchor for a heading, else the
  // nearest heading before it.
  function sectionAnchor(block) {
    if (block.hasAttribute('data-guide-anchor')) {
      return block.getAttribute('data-guide-anchor')
    }
    let anchor = null
    document.querySelectorAll('[data-guide-anchor]').forEach((heading) => {
      const before =
        heading.compareDocumentPosition(block) &
        Node.DOCUMENT_POSITION_FOLLOWING
      if (before) anchor = heading.getAttribute('data-guide-anchor')
    })
    return anchor
  }

  // A text directive's part: "-", "," and "&" have meanings there.
  function encodePart(words) {
    return encodeURIComponent(words.join(' ')).split('-').join('%2D')
  }

  // The block's text as a text directive: all of it when short, else its
  // first and last few words as a range.
  function textDirective(block) {
    const words = block.textContent.trim().split(/\s+/).filter(Boolean)
    if (!words.length) return ''
    if (words.length <= WORDS_EACH_END * 2) return encodePart(words)
    return `${encodePart(words.slice(0, WORDS_EACH_END))},${encodePart(words.slice(-WORDS_EACH_END))}`
  }

  function createLink(block) {
    const anchor = sectionAnchor(block)
    if (!anchor) return window.location.href.split('#')[0]
    const href = new URL(
      sectionHref + encodeURIComponent(anchor),
      window.location.origin
    )
    const isHeading = block.hasAttribute('data-guide-anchor')
    const text = isHeading ? '' : textDirective(block)
    if (text) href.searchParams.set('text', text)
    return href.toString()
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
    }
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
    return Promise.resolve()
  }

  button.addEventListener('click', () => {
    if (!current) return
    copy(createLink(current)).then(
      () => {
        setLabel('copied')
        status.textContent = 'Sharing link copied to clipboard.'
      },
      () => {
        status.textContent = 'The sharing link could not be copied.'
      }
    )
  })

  button.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      button.blur()
      button.hidden = true
      current = null
    }
  })
})()
