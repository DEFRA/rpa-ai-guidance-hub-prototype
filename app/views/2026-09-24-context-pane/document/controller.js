const { documentOverviewViewModel } = require('./view-model')

function get(req, res) {
  const viewModel = documentOverviewViewModel(req, req.params.id)

  if (!viewModel) {
    res.redirect('/2026-09-24-context-pane/hub')
    return
  }

  res.render('2026-09-24-context-pane/document/page.njk', viewModel)
}

module.exports = { get }
