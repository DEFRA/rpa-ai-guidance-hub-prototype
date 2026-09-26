const { guidanceDocuments } = require('../../../../../data/guidance-documents')
const guidanceLists = require('../../../../../data/guidance-lists')
const {
  documents: genericGuidanceContent
} = require('../../../../../data/generic-guidance-content')

// The stepper viewer — tracks the document as "recently opened" on genuine
// entry (no ?step= yet), same as the old find-guidance viewer did.
function get(req, res) {
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

  res.locals.backHref = '/playground/document/' + req.params.id

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

      res.render('playground/document/view/stepper/page.njk', {
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

    res.render('playground/document/view/stepper/page.njk', {
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

  res.render('playground/document/view/stepper/page.njk', {
    id: req.params.id,
    documentName,
    version,
    documents: genericGuidanceContent
  })
}

module.exports = { get }
