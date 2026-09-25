const { documentOverviewViewModel } = require('./view-model')

function get(req, res) {
  const viewModel = documentOverviewViewModel(req, req.params.id)

  if (!viewModel) {
    res.redirect('/consolidated/hub')
    return
  }

  res.render('consolidated/document/page.njk', viewModel)
}

module.exports = { get }
