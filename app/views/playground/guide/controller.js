const {
  guideViewModel,
  findApiGuide,
  chosenFormat,
  FORMAT_COOKIE,
  FORMAT_COOKIE_OPTIONS
} = require('./view-model')
const guidanceLists = require('../../../data/guidance-lists')
const guideAliases = require('../../../data/guide-aliases')
const {
  getPlaygroundApiGuides
} = require('../../../data/playground-api-guides')
const {
  fetchAsset,
  fetchLatestQualityCheck
} = require('../../../lib/guidance-api-client')

// A mock copy of a real guide (guide-aliases.js) goes to the real guide,
// keeping the rest of the address, so old links and saved lists land there.
async function redirectMockCopy(req, res, next) {
  await getPlaygroundApiGuides(req)
  const live = guideAliases.resolveGuideId(req, req.params.id)
  if (live === req.params.id) {
    next()
    return
  }
  const prefix = `/playground/guide/${encodeURIComponent(req.params.id)}`
  const rest = req.originalUrl.slice(prefix.length)
  res.redirect(`/playground/guide/${encodeURIComponent(live)}${rest}`)
}

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

  const format = chosenFormat(req)
  if (format) res.cookie(FORMAT_COOKIE, format, FORMAT_COOKIE_OPTIONS)

  res.render('playground/guide/page.njk', {
    ...viewModel,
    keywords: typeof req.query.keywords === 'string' ? req.query.keywords : ''
  })
}

// Proxies an API guide's image bytes through this server (rather than
// pointing <img> straight at GUIDANCE_API_BASE_URL) so the real API's base
// URL — and any auth it may need in future — stays server-side, the same
// reasoning as every other prototype call to the Prototype guides API.
async function getAsset(req, res) {
  // The URL carries the guide's name slug; the API wants its own id.
  const guide = await findApiGuide(req, req.params.id)
  const asset = guide && (await fetchAsset(guide.apiId, req.params.assetId))
  if (!asset) {
    res.status(404).end()
    return
  }

  res.set('Content-Type', asset.contentType)
  res.send(asset.buffer)
}

// The guide's latest completed quality check from the API, for the checks
// widget to show once its pretend run ends and for its comments
// (guide-comments.js): { issueCount, lastRun, versionId, comments }. 404 when
// there is none to show (not an API guide, never checked, or a check still
// running or failed), and the widget keeps its made-up numbers.
async function getQualityCheck(req, res) {
  const guide = await findApiGuide(req, req.params.id)
  const check = guide && (await fetchLatestQualityCheck(guide.apiId))
  if (!check || check.status !== 'completed' || !check.result) {
    res.status(404).json({})
    return
  }

  res.json({
    issueCount: check.result.comments.length,
    lastRun: check.updatedAt,
    versionId: check.versionId,
    comments: check.result.comments
  })
}

module.exports = { get, getAsset, getQualityCheck, redirectMockCopy }
