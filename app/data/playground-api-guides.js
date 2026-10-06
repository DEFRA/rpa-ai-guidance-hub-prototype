//
// The playground's view of the API's guides: the same documents as
// getRequestApiGuides, but `id` is a URL slug of the guide's name (made
// unique) instead of the API's uuid, which is kept as `apiId` for every call
// back to the API. Playground-only, because frozen snapshots still key API
// guides by uuid.
//

const { getRequestApiGuides } = require('./guidance-documents')

function slugify(title) {
  return (
    String(title)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'guide'
  )
}

function withSlugIds(guides) {
  const used = new Set()
  return guides.map((guide) => {
    const base = slugify(guide.title)
    let slug = base
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`
    used.add(slug)
    return { ...guide, id: slug, apiId: guide.id }
  })
}

// Also points req.apiGuides (read synchronously by side-nav.js) at the slugged
// list, since getRequestApiGuides resets it to the raw one on every call.
async function getPlaygroundApiGuides(req) {
  const raw = await getRequestApiGuides(req)
  if (!req.playgroundApiGuides || req.playgroundApiGuidesSource !== raw) {
    req.playgroundApiGuides = withSlugIds(raw)
    req.playgroundApiGuidesSource = raw
  }
  req.apiGuides = req.playgroundApiGuides
  return req.playgroundApiGuides
}

module.exports = { getPlaygroundApiGuides }
