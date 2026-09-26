const { documentOverviewViewModel } = require('./view-model')

function get(req, res) {
  const viewModel = documentOverviewViewModel(req, req.params.id)

  if (!viewModel) {
    res.redirect('/playground/hub')
    return
  }

  res.render('playground/document/page.njk', viewModel)
}

module.exports = { get }
