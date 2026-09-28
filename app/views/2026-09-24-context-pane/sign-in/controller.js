const { setRole } = require('../../../data/context-pane')

function get(req, res) {
  res.render('2026-09-24-context-pane/sign-in/page.njk', {
    selectedRole: req.session.data.role || 'viewer'
  })
}

// Fake sign-in, same as ever (no credentials checked) — the one real
// thing this now does is record which role's context-pane content the
// rest of the session sees. See app/data/context-pane.js.
function post(req, res) {
  setRole(req, req.body.role)
  res.redirect('/2026-09-24-context-pane/hub')
}

module.exports = { get, post }
