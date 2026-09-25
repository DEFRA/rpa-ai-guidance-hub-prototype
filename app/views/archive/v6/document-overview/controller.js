const { guidanceDocuments } = require('../../../data/guidance-documents')

// A stop between a result on organic-search.html and the document itself
// (saved-document-view.html, at /v6/find-guidance/document/:id). Falls
// back to the first entry in app/data/guidance-documents.js if the id does
// not match, so this page never breaks — including when visited with no id
// at all.
//
// defaultVersionKey tells the template which of document.versions.version1/
// version2 to show initially, matching document.version. versionsJson is
// that same versions object serialised once here, rather than with a
// template filter, so the page's own inline script can read both versions'
// lastUpdated/published/versionNotes and swap between them as the Version
// dropdown changes — no server round trip needed for a prototype. ?from=
// tells the template which breadcrumb trail to show.
function get(req, res) {
  const document =
    guidanceDocuments.find((candidate) => candidate.id === req.params.id) ||
    guidanceDocuments[0]

  res.render('versions/v6/document-overview', {
    document,
    from: req.query.from,
    defaultVersionKey:
      document.version === 'Version 1' ? 'version1' : 'version2',
    versionsJson: JSON.stringify(document.versions)
  })
}

module.exports = { get }
