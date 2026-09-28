const viewModel = require('./view-model')

function get(req, res) {
  res.render('playground/hub/page.njk', viewModel.fromSession(req))
}

module.exports = { get }
