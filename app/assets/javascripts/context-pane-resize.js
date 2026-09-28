//
// Context pane drag-to-resize — a JS enhancement over the native CSS
// resize handle already on .app-context-pane-row__pane
// (_app-context-pane.scss's own comment explains why that stays as the
// no-JS fallback rather than being replaced). This adds a full-height
// handle along the pane's right-hand border instead (partials/
// context-pane-resize-handle.njk), since a fixed corner grip is awkward
// to find and drag on a panel that can run the full height of the page.
//
// Keyboard support (Left/Right arrow keys) is new here, not something
// the native handle offers at all. Not persisted across page loads, same
// trade-off _app-context-pane.scss's own comment makes for the native
// handle.
//

document.addEventListener('DOMContentLoaded', function () {
  var pane = document.querySelector('.app-context-pane-row__pane')
  var handle = document.querySelector('[data-context-pane-resize-handle]')
  if (!pane || !handle) return

  var MIN_WIDTH = 220
  var MAX_WIDTH = 480
  var STEP = 20

  function currentWidth() {
    return pane.getBoundingClientRect().width
  }

  function setWidth(width) {
    var clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
    pane.style.width = clamped + 'px'
    handle.setAttribute('aria-valuenow', String(Math.round(clamped)))
  }

  handle.setAttribute('aria-valuemin', String(MIN_WIDTH))
  handle.setAttribute('aria-valuemax', String(MAX_WIDTH))
  handle.setAttribute('aria-valuenow', String(Math.round(currentWidth())))
  handle.hidden = false

  var dragStartX = null
  var dragStartWidth = null

  function onPointerMove(event) {
    if (dragStartX === null) return
    setWidth(dragStartWidth + (event.clientX - dragStartX))
  }

  function onPointerUp() {
    dragStartX = null
    dragStartWidth = null
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }

  handle.addEventListener('pointerdown', function (event) {
    dragStartX = event.clientX
    dragStartWidth = currentWidth()
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    event.preventDefault()
  })

  handle.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      setWidth(currentWidth() - STEP)
      event.preventDefault()
    } else if (event.key === 'ArrowRight') {
      setWidth(currentWidth() + STEP)
      event.preventDefault()
    }
  })
})
