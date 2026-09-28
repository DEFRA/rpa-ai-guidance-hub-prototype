const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v6/all-guidance-docs')
router.get('/', controller.get)

// Not nested under /v6/all-guidance-docs/... in the URL (matching the
// original /v6/manage-guidance-search path), so it needs its own router
// mounted at that separate prefix.
const searchRouter = govukPrototypeKit.requests.setupRouter(
  '/v6/manage-guidance-search'
)
searchRouter.get('/', controller.getSearch)
