const { guidanceDocuments } = require('../../../data/guidance-documents')
const {
  lookupAnyManageGuidanceDocument
} = require('../../../data/manage-guidance')
const guidanceLists = require('../../../data/guidance-lists')
const {
  documents: genericGuidanceContent
} = require('../../../data/generic-guidance-content')

// An intermediary step between the document overview page's "View" button
// and the guidance viewer itself — the consolidation plan's "keep the A/B"
// decision: two viewer layouts stay on offer (Stepper and Traditional)
// rather than merging them, since they're a genuine comparison, not a
// leftover duplicate like the editor/quality-check implementations were.
const VIEWER_HREFS = {
  stepper: (id) =>
    '/consolidated/document/' + encodeURIComponent(id) + '/view/stepper',
  traditional: (id) =>
    '/consolidated/document/' + encodeURIComponent(id) + '/view/traditional'
}

function getChoice(req, res) {
  const document = lookupAnyManageGuidanceDocument(req.params.id)

  res.render('consolidated/document-viewer/choice.njk', {
    id: req.params.id,
    documentTitle: document ? document.title : 'Guidance document',
    selected: '',
    errors: {},
    errorList: []
  })
}

function postChoice(req, res) {
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
    return res.render('consolidated/document-viewer/choice.njk', {
      id: req.params.id,
      documentTitle,
      selected: choice,
      errors,
      errorList: Object.values(errors)
    })
  }

  res.redirect(buildHref(req.params.id))
}

// The stepper viewer — tracks the document as "recently opened" on genuine
// entry (no ?step= yet), same as the old find-guidance viewer did.
function getStepper(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )

  if (guidanceDocument && !req.query.step) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
  }

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : guidanceDocuments[0].title
  const version = guidanceDocument
    ? guidanceDocument.version
    : guidanceDocuments[0].version

  res.locals.backHref = '/consolidated/document/' + req.params.id

  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const customParts = []
      const customSections = guidanceDocument.steps.map((section) => {
        const firstPartNumber = customParts.length + 1
        section.parts.forEach((part) => {
          customParts.push({
            partNumber: customParts.length + 1,
            sectionNumber: section.sectionNumber,
            sectionName: section.sectionName,
            partName: part.partName,
            heading: part.heading,
            body: part.body
          })
        })
        return {
          sectionNumber: section.sectionNumber,
          sectionName: section.sectionName,
          firstPartNumber
        }
      })

      const totalSteps = customParts.length
      const requestedStep = parseInt(req.query.step, 10)
      const stepNumber =
        requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

      res.render('consolidated/document-viewer/stepper.njk', {
        id: req.params.id,
        documentName,
        version,
        customParts,
        customSections,
        currentStep: customParts[stepNumber - 1],
        stepNumber,
        totalSteps,
        documents: genericGuidanceContent
      })
      return
    }

    const totalSteps = guidanceDocument.steps.length
    const requestedStep = parseInt(req.query.step, 10)
    const stepNumber =
      requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1

    res.render('consolidated/document-viewer/stepper.njk', {
      id: req.params.id,
      documentName,
      version,
      customSteps: guidanceDocument.steps,
      currentStep: guidanceDocument.steps[stepNumber - 1],
      stepNumber,
      totalSteps,
      documents: genericGuidanceContent
    })
    return
  }

  res.render('consolidated/document-viewer/stepper.njk', {
    id: req.params.id,
    documentName,
    version,
    documents: genericGuidanceContent
  })
}

// Flattens a document's own content into one consistent shape regardless
// of source — {id, heading, body}[], in reading order — so traditional.njk
// can render every section on one continuous page without caring which of
// the three content shapes produced them. Mirrors the exact per-shape
// logic getStepper above already has (nested customParts, flat
// customSteps, or the generic 3-phase genericGuidanceContent fallback),
// just collecting every entry instead of picking one by stepNumber.
function buildTraditionalSections(guidanceDocument) {
  if (guidanceDocument && guidanceDocument.steps) {
    const isNestedSteps = Array.isArray(guidanceDocument.steps[0].parts)

    if (isNestedSteps) {
      const sections = []
      guidanceDocument.steps.forEach((section) => {
        section.parts.forEach((part) => {
          sections.push({
            id: 'part-' + (sections.length + 1),
            heading: part.heading,
            body: part.body
          })
        })
      })
      return sections
    }

    return guidanceDocument.steps.map((step, index) => ({
      id: 'section-' + (index + 1),
      heading: step.heading,
      body: step.body
    }))
  }

  const genericDocument =
    (guidanceDocument && genericGuidanceContent[guidanceDocument.id]) ||
    genericGuidanceContent['countryside-stewardship-capital-grants']
  const sections = []
  genericDocument.sections.forEach((section) => {
    section.subsections.forEach((subsection) => {
      sections.push({
        id: subsection.id,
        heading: subsection.heading,
        body: subsection.content
      })
    })
  })
  return sections
}

// The traditional viewer — a genuine single-page A/B against the stepper
// (document-viewer/stepper.njk), showing the exact same document content
// (same buildTraditionalSections shapes as getStepper's own per-document
// logic above) laid out continuously rather than one step at a time.
//
// Previously this route rendered fixed severity/issues content instead —
// not a document viewer at all, just an undocumented duplicate of
// /consolidated/issues' own Issues/Findings layout, carried over unfixed
// from the same mistake in the v6 pages ("Traditional viewer" on
// v6/guidance-document-choice) this was ported from. That content is
// still available, correctly, at /consolidated/issues — removing the
// duplicate here isn't a loss of functionality, just of the accidental
// mislabeling. See page.notes.md for the full history.
//
// Tracked as "recently opened" the same as a genuine Stepper visit
// (getStepper's own addRecentlyOpened call) — unconditionally, since this
// page has no ?step=-equivalent "already mid-visit" case to skip.
function getTraditional(req, res) {
  const guidanceDocument = guidanceDocuments.find(
    (candidate) => candidate.id === req.params.id
  )

  if (guidanceDocument) {
    guidanceLists.addRecentlyOpened(req, guidanceDocument.id)
  }

  const documentName = guidanceDocument
    ? guidanceDocument.title
    : guidanceDocuments[0].title
  const version = guidanceDocument
    ? guidanceDocument.version
    : guidanceDocuments[0].version

  res.locals.backHref = '/consolidated/document/' + req.params.id

  res.render('consolidated/document-viewer/traditional.njk', {
    id: req.params.id,
    documentName,
    version,
    sections: buildTraditionalSections(guidanceDocument)
  })
}

module.exports = { getChoice, postChoice, getStepper, getTraditional }
