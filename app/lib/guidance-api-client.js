//
// Thin read-only client for the Prototype guides API (a separate service —
// see docs/prototype-guides-api.md for the full contract). Every function
// here fails safe: a network error, a non-2xx response, or unparsable JSON
// all log a `[guidance-api-client]`-prefixed message to stderr and resolve
// null, the same "never crash the dev server" convention
// app/lib/guidance-loader.js and app/lib/guidance-api-loader.js already
// use — callers never need a try/catch of their own around these.
//
// Uses Node's global fetch (available unprompted on the Node 24 this
// project runs on locally — see CLAUDE.md) rather than adding an HTTP
// client dependency for what is otherwise three GET requests.
//

const { GUIDANCE_API_BASE_URL } = require('./feature-flags')

function buildUrl(pathname, versionId) {
  const url = new URL(pathname, GUIDANCE_API_BASE_URL)
  if (versionId) url.searchParams.set('version_id', versionId)
  return url
}

// Manifest — the whole guides index, keyed by slug (see manifest.json's
// shape in the docs). Callers scan its values for a matching documentId
// themselves; this just fetches and parses it.
async function fetchManifest() {
  const url = buildUrl('/prototype/guides/manifest')
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(
        `[guidance-api-client] manifest fetch failed: ${response.status} ${response.statusText}`
      )
      return null
    }
    return await response.json()
  } catch (error) {
    console.error(
      '[guidance-api-client] manifest fetch failed:',
      error.message
    )
    return null
  }
}

// A guide's Markdown content. version_id is optional — omitted, the API
// resolves the manifest's own latestVersion for us; passed, it reads that
// exact version directly. Returns the raw Markdown text (still containing
// its ../assets/<file> references — see rewriteAssetLinks users) or null.
async function fetchGuideContent(documentId, versionId) {
  const url = buildUrl(
    `/prototype/guides/${encodeURIComponent(documentId)}/content`,
    versionId
  )
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(
        `[guidance-api-client] content fetch failed for ${documentId}: ${response.status} ${response.statusText}`
      )
      return null
    }
    return await response.text()
  } catch (error) {
    console.error(
      `[guidance-api-client] content fetch failed for ${documentId}:`,
      error.message
    )
    return null
  }
}

// A single asset's raw bytes (an image referenced from the guide's
// Markdown) plus its content type, for a route to proxy straight through
// to the browser. Returns { buffer, contentType } or null.
async function fetchAsset(documentId, assetId, versionId) {
  const url = buildUrl(
    `/prototype/guides/${encodeURIComponent(documentId)}/assets/${encodeURIComponent(assetId)}`,
    versionId
  )
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(
        `[guidance-api-client] asset fetch failed for ${documentId}/${assetId}: ${response.status} ${response.statusText}`
      )
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType:
        response.headers.get('content-type') || 'application/octet-stream'
    }
  } catch (error) {
    console.error(
      `[guidance-api-client] asset fetch failed for ${documentId}/${assetId}:`,
      error.message
    )
    return null
  }
}

module.exports = { fetchManifest, fetchGuideContent, fetchAsset }
