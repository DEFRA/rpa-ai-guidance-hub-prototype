const govukPrototypeKit = require('govuk-prototype-kit')
const { manifest } = require('./view-model')

const router = govukPrototypeKit.requests.setupRouter('/playground')

router.get('/manifest.webmanifest', (req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.type('application/manifest+json')
  res.send(JSON.stringify(manifest(req.baseUrl), null, 2))
})
