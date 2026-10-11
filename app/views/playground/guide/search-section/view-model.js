const {
  isDottedNumber,
  headingNumber,
  headingSlug
} = require('../../../../lib/section-numbers')

// Every section and part of a guide with the anchor that opens it. A
// section's lead part opens at the section itself.
function anchorsOf(content) {
  return content.sections.flatMap((section) =>
    section.parts.map((part) => ({
      anchor: part.isLead ? section.id : part.id,
      heading: part.heading || ''
    }))
  )
}

// The anchor of the section the API calls `number`, or null. The prototype
// splits a guide at its top two heading levels only, so a deeper section
// ("2.1.3") opens at the nearest part that holds it ("2.1").
function findSectionAnchor(content, number) {
  const anchors = anchorsOf(content)

  if (!isDottedNumber(number)) {
    const found = anchors.find(
      (candidate) => headingSlug(candidate.heading) === number
    )
    return found ? found.anchor : null
  }

  const numbered = anchors
    .map((candidate) => ({
      ...candidate,
      number: headingNumber(candidate.heading)
    }))
    .filter((candidate) => candidate.number)
  const found =
    numbered.find((candidate) => candidate.number === number) ||
    numbered
      .filter((candidate) => number.startsWith(candidate.number + '.'))
      .sort((a, b) => b.number.length - a.number.length)[0]
  return found ? found.anchor : null
}

module.exports = { findSectionAnchor }
