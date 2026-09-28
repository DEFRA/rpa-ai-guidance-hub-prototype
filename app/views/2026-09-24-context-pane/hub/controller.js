const viewModel = require('./view-model')

function get(req, res) {
  res.render('2026-09-24-context-pane/hub/page.njk', viewModel.fromSession(req))
}

module.exports = { get }
