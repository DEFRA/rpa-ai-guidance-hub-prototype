const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')

// An intermediary step between manage-guidance/document-overview.html's
// "View" button and the guidance viewer itself — offers a choice between
// two viewer layouts (GDS radios + Continue, not the earlier card-based
// version) rather than "View" going straight to one: "Stepper format"
// (/v6/find-guidance/document/:id, the real step-by-step guidance
// viewer — app/views/v6/find-guidance/, getDocument) and "Traditional
// viewer" (/v6/find-guidance/document-experiment/:id, a single-page
// layout currently being trialled alongside it — same module,
// getDocumentExperiment) — both under /v6/find-guidance/ rather than
// their own standalone routes, per the task this routing was last
// updated from. See VIEWER_HREFS and page.njk.
//
// lookupAnyManageGuidanceDocument (app/data/manage-guidance.js), not a
// plain guidanceDocuments lookup, for the title: the document-overview
// page this is reached from can show either a real guidanceDocuments
// entry or a sample Published document moved into Editing via "Start
// editing" (only ever in MANAGE_GUIDANCE_PUBLISHED_SAMPLES) — the same
// fallback that page's own view-model already needs for exactly this
// reason. Falls back to a generic title for an id that matches neither,
// rather than erroring — this page has nothing else that depends on the
// id resolving.
//
// No res.locals.backHref — the template shows breadcrumbs instead of a
// Back link (GOV.UK guidance is not to use both on the same page).
const VIEWER_HREFS = {
  stepper: (id) => '/v6/find-guidance/document/' + encodeURIComponent(id),
  traditional: (id) =>
    '/v6/find-guidance/document-experiment/' + encodeURIComponent(id)
}

function get(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)

  res.render('v6/guidance-document-choice/page.njk', {
    id: req.params.id,
    documentTitle: document ? document.title : 'Guidance document',
    selected: '',
    errors: {},
    errorList: []
  })
}

// Same "must select one option" validation pattern as create-guidance's
// own radios page (app/views/v6/create-guidance/controller.js) — govuk
// radios have no browser-native requirement here (novalidate on the
// form), so an empty submission needs a real server-side check rather
// than silently picking one viewer for the user.
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
    return res.render('v6/guidance-document-choice/page.njk', {
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
