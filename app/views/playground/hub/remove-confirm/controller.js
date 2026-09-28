const { guidanceDocuments } = require('../../../../data/guidance-documents')
const { LIST_NAMES } = require('../../../../data/context-pane')

function get(req, res) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  res.render('playground/hub/remove-confirm/page.njk', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    returnTo: req.query.returnTo || '/playground/hub',
    documentTitle: document ? document.title : null,
    listName: LIST_NAMES[req.query.tab] || null
  })
}

module.exports = { get }
