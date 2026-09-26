//
// Turns a free-text snapshot name into a URL-safe slug, e.g.
// "UR round 4 (mobile)" -> "ur-round-4-mobile".
//

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

module.exports = { slugify }
