const { guideViewModel } = require('./view-model')
const guidanceLists = require('../../../data/guidance-lists')
const { fetchAsset } = require('../../../lib/guidance-api-client')

async function get(req, res) {
  const viewModel = await guideViewModel(req, req.params.id)

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

// Proxies an API guide's image bytes through this server (rather than
// pointing <img> straight at GUIDANCE_API_BASE_URL) so the real API's base
// URL — and any auth it may need in future — stays server-side, the same
// reasoning as every other prototype call to the Prototype guides API.
async function getAsset(req, res) {
  const asset = await fetchAsset(req.params.id, req.params.assetId)
  if (!asset) {
    res.status(404).end()
    return
  }

  res.set('Content-Type', asset.contentType)
  res.send(asset.buffer)
}

module.exports = { get, getAsset }
