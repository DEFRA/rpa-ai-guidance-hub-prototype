const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v6/unified-guidance')

router.get('/', controller.get)
