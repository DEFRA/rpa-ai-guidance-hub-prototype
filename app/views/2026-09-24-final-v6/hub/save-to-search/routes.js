const govukPrototypeKit = require('govuk-prototype-kit')
const guidanceLists = require('../../../../data/guidance-lists')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-09-24-final-v6/hub/save-to-search'
)

router.post('/', (req, res) => {
  if (req.body && req.body.id) {
    guidanceLists.addSavedGuidance(req, req.body.id)
  }
  res.status(204).end()
})
