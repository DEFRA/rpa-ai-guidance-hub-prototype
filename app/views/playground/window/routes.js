const govukPrototypeKit = require('govuk-prototype-kit')

const router = govukPrototypeKit.requests.setupRouter('/playground/window')

// Option B's app home. /window/:id itself is the guide page, handed to the
// guide's own routes by middleware.js.
router.get('/', (req, res) => res.render('playground/window/home/page.njk'))
