const {
  lookupAnyManageGuidanceDocument
} = require('../../../../data/manage-guidance')

// An intermediary step between the document overview page's "View" button
// and the guidance viewer itself — the consolidation plan's "keep the A/B"
// decision: two viewer layouts stay on offer (Stepper and Traditional)
// rather than merging them, since they're a genuine comparison, not a
// leftover duplicate like the editor/quality-check implementations were.
const VIEWER_HREFS = {
  stepper: (id) =>
    '/playground/document/' + encodeURIComponent(id) + '/view/stepper',
  traditional: (id) =>
    '/playground/document/' + encodeURIComponent(id) + '/view/traditional'
}

function get(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)

  res.render('playground/document/view/page.njk', {
    id: req.params.id,
    documentTitle: document ? document.title : 'Guidance document',
    selected: '',
    errors: {},
    errorList: []
  })
}

function post(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)
  const documentTitle = document ? document.title : 'Guidance document'
  const choice = req.body.viewer || ''
  const buildHref = VIEWER_HREFS[choice]

  if (!buildHref) {
    const errors = {
      viewer: {
        text: 'Select how you would like to view this guidance',
        href: '#guidance-viewer'
      }
    }
    return res.render('playground/document/view/page.njk', {
      id: req.params.id,
      documentTitle,
      selected: choice,
      errors,
      errorList: Object.values(errors)
    })
  }

  res.redirect(buildHref(req.params.id))
}

module.exports = { get, post }
