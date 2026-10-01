const govukPrototypeKit = require('govuk-prototype-kit')
const guidanceLists = require('../../../../data/guidance-lists')

const router = govukPrototypeKit.requests.setupRouter(
  '/2026-10-01-side-nav-first-iteration/hub/save-to-search'
)

router.post('/', (req, res) => {
  if (req.body && req.body.id) {
    guidanceLists.addPinnedGuidance(req, req.body.id)
  }
  res.status(204).end()
})
