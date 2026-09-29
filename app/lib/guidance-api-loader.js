//
// Real API-backed guidance loader — reads the Prototype guides API's
// manifest (docs/prototype-guides-api.md) via
// app/lib/guidance-api-client.js and maps it into the same shape
// app/data/guidance-documents/index.js's own hardcoded entries use, so
// every existing consumer (hub, guide, side nav lists) can treat an
// API-sourced guide like any other guidanceDocuments entry.
//
// The manifest has no category/scheme/description of its own — those
// fields exist only so filtering/search elsewhere in the app has
// something to read, not because the API models them. `isApiGuide: true`
// and `latestVersionId` are the two fields nothing else has: they're how
// the guide page (app/views/playground/guide/view-model.js) tells an
// API-sourced document apart from a mock one and knows which version's
// content.md to fetch.
//
// Returns [] (logged to stderr) on any failure — a missing/unreachable
// manifest is a normal, silent-to-the-user state here, the same
// fail-safe standard every other loader in app/lib/ already follows;
// app/data/guidance-documents/index.js's getGuidanceDocuments() is what
// turns an empty result into a fallback to the mock dataset.
//

const { fetchManifest } = require('./guidance-api-client')

function formatDate(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function mapManifestEntryToDocument(entry) {
  const latest = entry.versions.find(
    (version) => version.version === entry.latestVersion
  )
  const versionKey = entry.latestVersion === 2 ? 'version2' : 'version1'

  return {
    id: entry.documentId,
    title: entry.title,
    description: '',
    version: `Version ${entry.latestVersion}`,
    lastUpdated: latest ? formatDate(latest.createdAt) : '',
    published: latest ? formatDate(latest.createdAt) : '',
    category: 'General',
    scheme: 'General',
    year: latest ? new Date(latest.createdAt).getFullYear() : undefined,
    showOnOrganicSearch: true,
    // Mirrors metadata.js's own versions.version1/version2 shape (see
    // document/view-model.js's defaultVersionKey, which reads it back by
    // that same key) with just the one entry the manifest actually gives
    // us — the guide page's byline ("Updated <date>") reads
    // currentVersion.lastUpdated off this, so it can't be left empty.
    versions: {
      [versionKey]: {
        label: `Version ${entry.latestVersion}`,
        lastUpdated: latest ? formatDate(latest.createdAt) : '',
        published: latest ? formatDate(latest.createdAt) : '',
        versionNotes: ''
      }
    },
    steps: [],
    isApiGuide: true,
    latestVersionId: latest ? latest.versionId : null
  }
}

async function loadGuidanceFromApi() {
  const manifest = await fetchManifest()
  if (!manifest) {
    console.error(
      '[guidance-api-loader] no manifest available — returning no documents'
    )
    return []
  }

  return Object.values(manifest).map(mapManifestEntryToDocument)
}

module.exports = { loadGuidanceFromApi }
