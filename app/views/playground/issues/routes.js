const govukPrototypeKit = require('govuk-prototype-kit')
const controller = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/playground/issues')

router.get('/', (req, res) => res.redirect('/playground/hub'))
router.get('/:id', controller.getIssues)
