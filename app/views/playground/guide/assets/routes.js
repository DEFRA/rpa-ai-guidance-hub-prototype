const govukPrototypeKit = require('govuk-prototype-kit')
const { guideAssetPath } = require('../../../../data/guide-markdown')

// Serves a converted guide's images (app/data/guides/<id>/assets/), which
// its Markdown references as /playground/guide/<id>/assets/<file>.
// guideAssetPath refuses anything reaching outside that directory. A miss
// falls through to guide/routes.js's API asset proxy on the same path.
const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.get('/:id/assets/:file', (req, res, next) => {
  const file = guideAssetPath(req.params.id, req.params.file)
  if (!file) {
    next()
    return
  }
  res.sendFile(file)
})
