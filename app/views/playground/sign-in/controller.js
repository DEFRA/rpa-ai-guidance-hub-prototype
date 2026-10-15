const { setRole } = require('../../../data/context-pane')
const { OPEN_IN, getOpenIn, setOpenIn } = require('../../../data/pwa')

function get(req, res) {
  const openIn = getOpenIn(req)
  res.render('playground/sign-in/page.njk', {
    selectedRole: req.session.data.role || 'viewer',
    openInItems: Object.keys(OPEN_IN).map((value) => ({
      value,
      text: OPEN_IN[value].text,
      hint: { text: OPEN_IN[value].hint },
      checked: value === openIn
    }))
  })
}

// Fake sign-in, same as ever (no credentials checked) — it records which
// role's side-nav items the rest of the session sees (app/data/side-nav.js)
// and whether guides open in the PWA or the browser (app/data/pwa.js).
function post(req, res) {
  setRole(req, req.body.role)
  setOpenIn(req, req.body.pwaOpenIn)
  res.redirect('/playground/hub')
}

module.exports = { get, post }
