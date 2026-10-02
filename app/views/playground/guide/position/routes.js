const govukPrototypeKit = require('govuk-prototype-kit')
const { locateAnchor } = require('../view-model')
const { setGuidePosition } = require('../../../../data/guide-positions')

// Saves where a reader has scrolled to in a guide, posted by
// guide-position.js as they read — the guide's own mirror of
// panel-width/routes.js. An anchor the guide doesn't have is ignored.
const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.post('/:id/position', async (req, res) => {
  setGuidePosition(
    req,
    req.params.id,
    await locateAnchor(req, req.params.id, String(req.body.anchor || ''))
  )
  res.sendStatus(204)
})
