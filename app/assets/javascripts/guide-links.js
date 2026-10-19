//
// Opens a guide's links to its own headings in this tab. The TipTap viewer
// (vendor/tiptap-viewer.js) gives every link target="_blank", so a link to
// another part of the guide, on whichever stepper page holds it, opened a
// new tab. The server-rendered fallback never did. A link to another site
// still opens a new tab.
//
// Done on the click rather than by removing the attribute: the viewer owns
// its DOM, and would read a changed link back into its document.
//
;(function () {
  const root = document.querySelector('.app-guide-reading')
  if (!root) return

  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[target="_blank"][href]')
    if (!link || !root.contains(link)) return

    // Ctrl-, Shift- and middle-clicks still open a tab or window, as asked.
    const plainClick =
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    if (!plainClick || event.defaultPrevented) return

    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin) return

    event.preventDefault()
    window.location.assign(url)
  })
})()
