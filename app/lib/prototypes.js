//
// Helpers for the prototype index defined in app/data/prototypes.js.
//
// Everything is resolved per request rather than cached at startup, so a page
// you have just created shows up as built without restarting the kit.
//

const fs = require('fs')
const path = require('path')

const { versions } = require('../data/prototypes')

const viewsDir = path.join(__dirname, '..', 'views')
const viewExtensions = ['.html', '.njk']

// A step counts as built once a view file exists at its path.
function stepExists (stepPath) {
  return viewExtensions.some((extension) =>
    fs.existsSync(path.join(viewsDir, `${stepPath}${extension}`))
  )
}

function decorateJourney (journey, version) {
  const steps = journey.steps.map((step, index) => ({
    ...step,
    index,
    number: index + 1,
    // Steps marked `route` are served by app/routes.js rather than a view file
    // of their own — a finding page built from a URL parameter, for instance.
    exists: step.route === true || stepExists(step.path)
  }))

  // Outcomes off the main sequence — a rejected file, an error. Kept out of the
  // numbered steps so the step count still describes the journey, but listed so
  // they are reachable from the index for research.
  const alternatives = (journey.alternatives || []).map((alternative) => ({
    ...alternative,
    exists: stepExists(alternative.path)
  }))

  return {
    ...journey,
    versionId: version.id,
    versionName: version.name,
    steps,
    alternatives,
    stepCount: steps.length,
    builtCount: steps.filter((step) => step.exists).length,
    // Where "Start journey" points. Falls back to the first built step so the
    // link still works while the opening pages are being written.
    startHref: (steps.find((step) => step.exists) || {}).path
  }
}

// Journeys grouped by persona, preserving the order they are defined in.
function groupByPersona (journeys) {
  const groups = []

  journeys.forEach((journey) => {
    const name = journey.persona || 'Other'
    const group = groups.find((candidate) => candidate.name === name)

    if (group) {
      group.journeys.push(journey)
    } else {
      groups.push({ name, journeys: [journey] })
    }
  })

  return groups
}

// All versions, with build state resolved.
function getVersions () {
  return versions.map((version) => {
    const journeys = version.journeys.map((journey) =>
      decorateJourney(journey, version)
    )

    return {
      ...version,
      journeys,
      personas: groupByPersona(journeys),
      journeyCount: journeys.length,
      stepCount: journeys.reduce((total, j) => total + j.stepCount, 0),
      builtCount: journeys.reduce((total, j) => total + j.builtCount, 0)
    }
  })
}

function getCurrentVersion () {
  return getVersions().find((version) => version.status === 'current')
}

function getPreviousVersions () {
  return getVersions().filter((version) => version.status !== 'current')
}

function allJourneys () {
  return getVersions().flatMap((version) =>
    version.journeys.map((journey) => ({ version, journey }))
  )
}

// Locate a URL within the journey data, so a page can show where it sits and
// link back and forward without repeating the sequence in the template.
//
// Sign in and the landing page belong to several journeys at once, so the
// journey the participant actually started takes priority — otherwise a shared
// page would always send them down whichever variant happens to be defined
// first.
function findStep (urlPath, activeJourneyId) {
  const candidates = allJourneys()
  const ordered = [
    ...candidates.filter(({ journey }) => journey.id === activeJourneyId),
    ...candidates.filter(({ journey }) => journey.id !== activeJourneyId)
  ]

  for (const { version, journey } of ordered) {
    const index = journey.steps.findIndex(
      (step) =>
        step.path === urlPath ||
        // A route-backed step covers the URLs beneath it, so /findings/3 is
        // recognised as the /findings step rather than falling off the journey.
        (step.route === true && urlPath.startsWith(`${step.path}/`))
    )

    if (index !== -1) {
      return {
        version,
        journey,
        step: journey.steps[index],
        previous: journey.steps[index - 1],
        next: journey.steps[index + 1]
      }
    }

    // An outcome off the main sequence still belongs to a journey, so the page
    // can say which variant produced it even though it has no step number.
    const alternative = journey.alternatives.find(
      (candidate) => candidate.path === urlPath
    )

    if (alternative) {
      return { version, journey, alternative }
    }
  }
}

// Where a branch such as "migrate" should start. A page shared between variants
// — the landing page — uses this so it sends the participant down the variant
// they were started on, falling back to the first one defined.
function getBranchStart (branch, activeJourneyId) {
  const journeys = allJourneys().map(({ journey }) => journey)

  const journey =
    journeys.find((j) => j.branch === branch && j.id === activeJourneyId) ||
    journeys.find((j) => j.branch === branch)

  if (!journey) return

  const step = journey.steps.find((s) => s.startsBranch) || journey.steps[0]

  // Carry the journey through the link so the rest of the branch stays on the
  // same variant.
  return `${step.path}?j=${journey.id}`
}

module.exports = {
  getVersions,
  getCurrentVersion,
  getPreviousVersions,
  findStep,
  getBranchStart
}
