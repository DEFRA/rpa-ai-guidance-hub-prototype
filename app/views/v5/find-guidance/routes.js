const govukPrototypeKit = require('govuk-prototype-kit')
const { get } = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/v5/find-guidance')

router.get('/', get)
