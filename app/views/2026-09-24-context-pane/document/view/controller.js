const {
  lookupAnyManageGuidanceDocument
} = require('../../../../data/manage-guidance')
const { buildContextPane } = require('../../../../data/context-pane')

// An intermediary step between the document overview page's "View" button
// and the guidance viewer itself — the consolidation plan's "keep the A/B"
// decision: two viewer layouts stay on offer (Stepper and Traditional)
// rather than merging them, since they're a genuine comparison, not a
// leftover duplicate like the editor/quality-check implementations were.
const VIEWER_HREFS = {
  stepper: (id) =>
    '/2026-09-24-context-pane/document/' +
    encodeURIComponent(id) +
    '/view/stepper',
  traditional: (id) =>
    '/2026-09-24-context-pane/document/' +
    encodeURIComponent(id) +
    '/view/traditional'
}

function get(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)

  res.render('2026-09-24-context-pane/document/view/page.njk', {
    id: req.params.id,
    documentTitle: document ? document.title : 'Guidance document',
    selected: '',
    errors: {},
    errorList: [],
    contextPane: buildContextPane(req, {
      documentId: req.params.id,
      returnHref: req.originalUrl
    })
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
    return res.render('2026-09-24-context-pane/document/view/page.njk', {
      id: req.params.id,
      documentTitle,
      selected: choice,
      errors,
      errorList: Object.values(errors),
      contextPane: buildContextPane(req, {
        documentId: req.params.id,
        returnHref: req.originalUrl
      })
    })
  }

  res.redirect(buildHref(req.params.id))
}

module.exports = { get, post }
