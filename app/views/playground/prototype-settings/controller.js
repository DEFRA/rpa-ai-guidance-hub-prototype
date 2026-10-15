const { setMode, setBLaunch } = require('../../../data/pwa')
const { settingsViewModel } = require('./view-model')

function get(req, res) {
  res.render(
    'playground/prototype-settings/page.njk',
    settingsViewModel(req, req.baseUrl.replace(/\/prototype-settings$/, ''))
  )
}

function post(req, res) {
  setMode(req, req.body.pwaMode)
  setBLaunch(req, req.body.pwaBLaunch)
  res.redirect(`${req.baseUrl}?saved=1`)
}

module.exports = { get, post }
