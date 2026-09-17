//
// Shared by app/lib/prototypes.js and app/lib/page-notes.js: both need to turn
// a URL path into the view file it renders from, and both must agree on the
// one non-obvious convention in this repo — a /vN/... route renders from
// app/views/versions/vN/..., not app/views/vN/...
//

const viewExtensions = ['.html', '.njk']

function templatePathFor(urlPath) {
  const versionMatch = urlPath.match(/^\/(v\d+)\/(.+)$/)
  return versionMatch
    ? `/versions/${versionMatch[1]}/${versionMatch[2]}`
    : urlPath
}

module.exports = { templatePathFor, viewExtensions }
