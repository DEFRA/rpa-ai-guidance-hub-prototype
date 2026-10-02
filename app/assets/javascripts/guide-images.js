//
// Marks a guide's images as loaded (`is-loaded`), so _app-guide.scss can
// reserve space for the ones that haven't. Without it a lazy image has no
// size until it loads, a run of them stacks at 0px height, and the browser
// treats them all as near the viewport and fetches the lot.
//
;(function () {
  const root = document.querySelector('.app-guide-reading')
  if (!root) return

  // Only with JavaScript, so a reader without it never gets stuck with the
  // reserved space.
  root.classList.add('app-guide-reading--track-images')

  function markLoaded(image) {
    image.classList.add('is-loaded')
  }

  // `load` doesn't bubble, but does reach a capturing listener — which also
  // covers images the TipTap viewer adds later.
  root.addEventListener(
    'load',
    (event) => {
      if (event.target.tagName === 'IMG') markLoaded(event.target)
    },
    true
  )
  // A failed image has its alt text to show, so stops reserving space.
  root.addEventListener(
    'error',
    (event) => {
      if (event.target.tagName === 'IMG') markLoaded(event.target)
    },
    true
  )

  root.querySelectorAll('img').forEach((image) => {
    if (image.complete) markLoaded(image)
  })
})()
