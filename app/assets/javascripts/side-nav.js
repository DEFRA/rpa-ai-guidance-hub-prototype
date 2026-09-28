//
// Progressive enhancement for the side navigation (partials/side-nav.njk,
// side-nav-rail.njk, the shell in layouts/main.html). Only loaded on pages
// that have it. Everything here works without it: disclosures are native
// <details>, collapse/expand is a form POST, and on narrow screens the nav
// stacks above the content.
//
// Adds: closing "…" menus on Esc/outside click, one open at a time;
// Esc-dismissable rail tooltips (WCAG 1.4.13); Ctrl/Cmd+K to search
// (a modifier shortcut, so WCAG 2.1.4 doesn't need an off switch); the
// guide picker autocomplete; and the narrow-screen drawer.
//
;(function () {
  const shell = document.querySelector('[data-module="app-side-nav"]')
  if (!shell) return

  const nav = shell.querySelector('.app-shell__nav')
  const toggleForm = document.getElementById('side-nav-toggle-form')
  const toolbarToggle = shell.querySelector('[data-side-nav-toolbar-toggle]')
  const toolbarLabel = shell.querySelector('[data-side-nav-toolbar-label]')
  const narrow = window.matchMedia('(max-width: 768.98px)')
  const isMac = /Mac|iPhone|iPad/.test(
    navigator.platform || navigator.userAgent
  )

  // --- Disclosures ("…" menus and the role switcher) ----------------------

  const disclosures = Array.from(
    shell.querySelectorAll('[data-side-nav-disclosure]')
  )

  function closeDisclosure(details, returnFocus) {
    if (!details.open) return
    details.open = false
    if (returnFocus) details.querySelector('summary').focus()
  }

  disclosures.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return
      disclosures.forEach((other) => {
        if (other !== details) closeDisclosure(other, false)
      })
    })
    details.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && details.open) {
        event.stopPropagation()
        closeDisclosure(details, true)
      }
    })
  })

  document.addEventListener('click', (event) => {
    disclosures.forEach((details) => {
      if (details.open && !details.contains(event.target)) {
        closeDisclosure(details, false)
      }
    })
  })

  // --- Rail tooltips --------------------------------------------------------

  shell.querySelectorAll('[data-side-nav-tooltip]').forEach((item) => {
    const reset = () =>
      item.classList.remove('app-side-nav__rail-item--tooltip-dismissed')
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        item.classList.add('app-side-nav__rail-item--tooltip-dismissed')
      }
    })
    item.addEventListener('blur', reset)
    item.addEventListener('mouseleave', reset)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    const hovered = shell.querySelector('[data-side-nav-tooltip]:hover')
    if (hovered) {
      hovered.classList.add('app-side-nav__rail-item--tooltip-dismissed')
    }
  })

  // --- Narrow-screen drawer -------------------------------------------------

  let backdrop = null
  let drawerOpen = false

  function setToolbarState() {
    if (narrow.matches) {
      toolbarToggle.setAttribute('aria-expanded', String(drawerOpen))
      toolbarLabel.textContent = drawerOpen
        ? 'Close navigation'
        : 'Open navigation'
    } else {
      toolbarToggle.removeAttribute('aria-expanded')
      toolbarLabel.textContent = shell.classList.contains(
        'app-shell--collapsed'
      )
        ? 'Expand navigation'
        : 'Collapse navigation'
    }
  }

  function openDrawer() {
    if (!backdrop) {
      backdrop = document.createElement('div')
      backdrop.className = 'app-shell__backdrop'
      backdrop.addEventListener('click', () => closeDrawer(true))
      shell.appendChild(backdrop)
    }
    drawerOpen = true
    shell.classList.add('app-shell--drawer-open')
    setToolbarState()
    const first = nav.querySelector('a, button, input, summary')
    if (first) first.focus()
  }

  function closeDrawer(returnFocus) {
    if (!drawerOpen) return
    drawerOpen = false
    shell.classList.remove('app-shell--drawer-open')
    setToolbarState()
    if (returnFocus) toolbarToggle.focus()
  }

  toolbarToggle.addEventListener('click', (event) => {
    if (!narrow.matches) return
    event.preventDefault()
    if (drawerOpen) closeDrawer(true)
    else openDrawer()
  })

  // In the drawer the nav's own "Collapse navigation" just closes it.
  const collapseButton = shell.querySelector('[data-side-nav-collapse]')
  if (collapseButton) {
    collapseButton.addEventListener('click', (event) => {
      if (!narrow.matches) return
      event.preventDefault()
      closeDrawer(true)
    })
  }

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawerOpen && !event.defaultPrevented) {
      closeDrawer(true)
    }
  })

  // Not modal: tabbing out of the drawer closes it rather than trapping focus.
  nav.addEventListener('focusout', (event) => {
    if (
      drawerOpen &&
      event.relatedTarget &&
      !nav.contains(event.relatedTarget)
    ) {
      closeDrawer(false)
    }
  })

  narrow.addEventListener('change', () => {
    closeDrawer(false)
    setToolbarState()
  })
  setToolbarState()

  // --- Search shortcut ------------------------------------------------------

  const searchInput = shell.querySelector('[data-side-nav-search]')
  const kbd = shell.querySelector('[data-side-nav-kbd]')

  if (searchInput && kbd) {
    kbd.textContent = isMac ? '⌘ K' : 'Ctrl K'
    kbd.setAttribute('aria-hidden', 'true')
    kbd.hidden = false
    searchInput.setAttribute(
      'aria-keyshortcuts',
      isMac ? 'Meta+K' : 'Control+K'
    )
  }

  document.addEventListener('keydown', (event) => {
    const modifier = isMac ? event.metaKey : event.ctrlKey
    if (!modifier || event.altKey || event.key.toLowerCase() !== 'k') return
    event.preventDefault()

    // Auto-collapsed on a mid-width window: the full nav (and its search box)
    // is display: none, so expand like the collapsed rail does.
    const autoRailShown = shell.querySelector('.app-shell__rail')?.offsetParent
    const expandForm = autoRailShown
      ? document.getElementById('side-nav-expand-form')
      : toggleForm

    if (searchInput && !autoRailShown) {
      if (narrow.matches && !drawerOpen) openDrawer()
      searchInput.focus()
      searchInput.select()
    } else if (expandForm) {
      // Collapsed rail: expand, landing on the search box.
      const returnTo = expandForm.querySelector('[name="returnTo"]')
      returnTo.value = returnTo.value.split('#')[0] + '#side-nav-search'
      expandForm.submit()
    }
  })

  // --- Landing on a nav fragment -------------------------------------------

  if (window.location.hash === '#side-nav-search' && searchInput) {
    searchInput.focus()
  }

  // --- Resize (expanded nav / guide panel, desktop) ------------------------
  // Same approach as the context pane's resize: a full-height separator,
  // draggable, with Left/Right (Home/End) keys. The width is saved to the
  // session so it holds across pages. Double-click resets it. With this
  // attached, the native corner grip (the no-JS fallback) is switched off
  // so there's one control, not two.
  //
  // Shared by the nav's own handle and the guide panel's
  // (app/views/playground/guide/page.njk) — same behaviour, opposite edge:
  // `direction` is which arrow key (and which way a drag) grows the
  // target, +1 when its handle is on the target's trailing (right) edge
  // like the nav's, -1 when it's on the leading (left) edge like the
  // panel's.
  function setupResize({
    handle,
    target,
    applyWidth,
    defaultWidth,
    direction
  }) {
    if (!handle || !target) return

    const MIN = Number(handle.getAttribute('aria-valuemin'))
    const MAX = Number(handle.getAttribute('aria-valuemax'))
    const STEP = 20
    const widthHref = handle.getAttribute('data-width-href')
    let saveTimer = null

    const currentWidth = () => Math.round(target.getBoundingClientRect().width)

    function reflectWidth(width) {
      handle.setAttribute('aria-valuenow', String(width))
      handle.setAttribute('aria-valuetext', `${width} pixels wide`)
    }

    function setWidth(value) {
      const width = Math.round(Math.min(MAX, Math.max(MIN, value)))
      applyWidth(width)
      reflectWidth(width)
      return width
    }

    function save(delay) {
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        const body = new URLSearchParams({ width: String(currentWidth()) })
        window.fetch(widthHref, { method: 'POST', body }).catch(() => {})
      }, delay)
    }

    target.style.resize = 'none'
    reflectWidth(currentWidth())
    handle.hidden = false

    let dragStartX = null
    let dragStartWidth = null

    function onPointerMove(event) {
      if (dragStartX === null) return
      setWidth(dragStartWidth + (event.clientX - dragStartX) * direction)
    }

    function onPointerUp() {
      dragStartX = null
      shell.classList.remove('app-shell--resizing')
      handle.classList.remove('app-shell__resize--dragging')
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      save(0)
    }

    handle.addEventListener('pointerdown', (event) => {
      dragStartX = event.clientX
      dragStartWidth = currentWidth()
      shell.classList.add('app-shell--resizing')
      handle.classList.add('app-shell__resize--dragging')
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      event.preventDefault()
    })

    handle.addEventListener('dblclick', () => {
      setWidth(defaultWidth)
      save(0)
    })

    handle.addEventListener('keydown', (event) => {
      const moves = {
        ArrowLeft: () => currentWidth() - STEP * direction,
        ArrowRight: () => currentWidth() + STEP * direction,
        Home: () => MIN,
        End: () => MAX
      }
      if (!moves[event.key]) return
      event.preventDefault()
      setWidth(moves[event.key]())
      save(400)
    })
  }

  setupResize({
    handle: shell.querySelector('[data-side-nav-resize]'),
    target: nav,
    applyWidth: (px) =>
      shell.style.setProperty('--app-side-nav-width', `${px}px`),
    defaultWidth: 280,
    direction: 1
  })

  const guidePanel = shell.querySelector('.app-guide-panel')
  setupResize({
    handle: shell.querySelector('[data-guide-panel-resize]'),
    target: guidePanel,
    applyWidth: (px) =>
      guidePanel.style.setProperty('--app-guide-panel-width', `${px}px`),
    defaultWidth: 320,
    direction: -1
  })

  // --- Size the nav to the visible viewport --------------------------------
  // The nav is sticky with its own scroll but starts below the Defra header,
  // so a plain 100vh would push its sticky Help/Settings footer off the
  // bottom of the screen until the page is scrolled. Without JS it falls
  // back to 100vh.

  let frame = null

  // On mid-width windows the auto-collapsed rail stands in for the nav.
  const rail = shell.querySelector('.app-shell__rail')

  function syncNavHeight() {
    frame = null
    const visible = rail && rail.offsetParent ? rail : nav
    const top = Math.max(0, visible.getBoundingClientRect().top)
    shell.style.setProperty('--app-side-nav-top', `${top}px`)
  }

  function requestSync() {
    if (!frame) frame = window.requestAnimationFrame(syncNavHeight)
  }

  window.addEventListener('scroll', requestSync, { passive: true })
  window.addEventListener('resize', requestSync)
  syncNavHeight()
})()
