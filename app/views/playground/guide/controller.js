const { guideViewModel } = require('./view-model')
const guidanceLists = require('../../../data/guidance-lists')

function get(req, res) {
  const viewModel = guideViewModel(req, req.params.id)

  if (!viewModel) {
    res.redirect('/playground/hub')
    return
  }

  // Tracked as "recently opened" on genuine entry only (no ?step= yet),
  // same as the old stepper viewer's own controller.
  if (viewModel.trackRecentlyOpened) {
    guidanceLists.addRecentlyOpened(req, viewModel.id, viewModel.version)
  }

  res.locals.backHref = '/playground/hub'
  res.render('playground/guide/page.njk', viewModel)
}

module.exports = { get }
