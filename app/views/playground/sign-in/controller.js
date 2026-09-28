const { setRole } = require('../../../data/context-pane')

function get(req, res) {
  res.render('playground/sign-in/page.njk', {
    selectedRole: req.session.data.role || 'viewer'
  })
}

// Fake sign-in, same as ever (no credentials checked) — the one real
// thing this now does is record which role's side-nav items the rest of
// the session sees. See app/data/side-nav.js.
function post(req, res) {
  setRole(req, req.body.role)
  res.redirect('/playground/hub')
}

module.exports = { get, post }
