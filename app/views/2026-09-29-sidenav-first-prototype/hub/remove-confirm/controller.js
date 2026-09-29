const { guidanceDocuments } = require('../../../../data/guidance-documents')
const { LIST_NAMES } = require('../../../../data/context-pane')

function get(req, res) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  res.render('2026-09-29-sidenav-first-prototype/hub/remove-confirm/page.njk', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    returnTo: req.query.returnTo || '/2026-09-29-sidenav-first-prototype/hub',
    documentTitle: document ? document.title : null,
    listName: LIST_NAMES[req.query.tab] || null
  })
}

module.exports = { get }
