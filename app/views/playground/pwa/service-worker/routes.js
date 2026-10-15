const path = require('node:path')
const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter('/playground')

// Served from the playground root (not /public/) so its default scope
// covers every playground page.
router.get('/sw.js', (req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.type('application/javascript')
  res.sendFile(path.join(__dirname, 'service-worker.js'))
})
