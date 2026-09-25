const { guidanceDocuments } = require('../../../../data/guidance-documents')
const {
  documents: genericGuidanceContent
} = require('../../../../data/generic-guidance-content')

// Persists the editor's current live content (including unsaved edits and
// any reordering, since nothing here is saved until "Save") — shared by
// Preview and Send for approval, which both capture the same draft before
// navigating on. "steps" is already split into one entry per Content-nav
// section by the client (buildCustomStepsFromEditor, editor/page.njk).
function post(req, res) {
  const steps = Array.isArray(req.body && req.body.steps) ? req.body.steps : []

  req.session.data.editorExperimentPreview = {
    id: (req.body && req.body.id) || '',
    title: (req.body && req.body.title) || '',
    html: (req.body && req.body.html) || '',
    steps: steps.map((step, index) => ({
      sectionNumber: index + 1,
      sectionName: (step && step.sectionName) || '',
      heading: (step && step.heading) || '',
      body: Array.isArray(step && step.body) ? step.body : []
    }))
  }

  res.status(204).end()
}

// Renders the real stepper viewer from the in-progress content captured
// above, rather than from any guidance-documents.js entry — the same
// template/branch a document with real flat "steps" already uses.
function get(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview || !preview.steps.length) {
    res.redirect('/consolidated/editor')
    return
  }

  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === preview.id
  )
  const totalSteps = preview.steps.length
  const requestedStep = parseInt(req.query.step, 10)
  const stepNumber =
    requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

  res.locals.backHref =
    '/consolidated/editor' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('consolidated/document/view/stepper/page.njk', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    version: guidanceDocument ? guidanceDocument.version : 'Version 1',
    documents: genericGuidanceContent,
    customSteps: preview.steps,
    currentStep: preview.steps[stepNumber - 1],
    stepNumber,
    totalSteps,
    isPreview: true,
    stepLinkBase: '/consolidated/editor/preview'
  })
}

module.exports = { post, get }
