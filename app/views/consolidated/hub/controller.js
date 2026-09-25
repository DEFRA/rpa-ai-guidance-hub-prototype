const viewModel = require('./view-model')

function get(req, res) {
  res.render('consolidated/hub/page.njk', viewModel.fromSession(req))
}

module.exports = { get }
