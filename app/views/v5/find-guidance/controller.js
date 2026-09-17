const viewModel = require('./view-model')

// No backHref — find-guidance/page.njk shows breadcrumbs instead of a Back
// link (see the template).
function get(req, res) {
  res.render('v5/find-guidance/page.njk', viewModel.fromSession(req))
}

module.exports = { get }
