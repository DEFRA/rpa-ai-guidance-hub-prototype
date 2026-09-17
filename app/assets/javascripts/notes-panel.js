//
// Notes panel: toggles the drawer rendered by
// app/views/partials/notes-panel.njk. Purely client-side — the data itself is
// already rendered server-side (see app/lib/page-notes.js), so there's
// nothing here to share with the server the way quality-checks.js is.
//

function toggleNotesPanel() {
  var panel = document.getElementById('app-notes-panel')
  if (panel) {
    panel.classList.toggle('app-notes-panel--open')
  }
}

document.addEventListener('keydown', function (event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'N') {
    toggleNotesPanel()
  }
})
