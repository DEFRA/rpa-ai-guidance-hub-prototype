//
// The info button beside a guide's title (playground/guide/page.njk): a
// toggle that opens the grey panel of the guide's information under the
// title, and shows pressed while it is open. Both start closed in the page
// itself, so nothing flickers as it loads.
//
;(function () {
  const button = document.querySelector('[data-guide-info-toggle]')
  const panel = document.querySelector('[data-guide-info]')
  if (!button || !panel) return

  const tooltip = button.querySelector('[data-guide-info-tooltip]')

  function setOpen(open) {
    panel.hidden = !open
    button.setAttribute('aria-expanded', String(open))
    tooltip.textContent = open
      ? 'Hide guide information'
      : 'Show guide information'
  }

  button.addEventListener('click', () => {
    setOpen(panel.hidden)
  })
})()
