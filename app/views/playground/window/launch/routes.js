const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter(
  '/playground/window/launch'
)

// The manifest's protocol handler target: a web+guidancehub://guide/<id>
// link launches the app here with ?target=<that link>.
router.get('/', (req, res) => {
  const target = typeof req.query.target === 'string' ? req.query.target : ''
  const match = target.match(/^web\+guidancehub:\/\/guide\/([a-z0-9-]+)/i)
  res.redirect(match ? `/playground/window/${match[1]}` : '/playground/hub')
})
