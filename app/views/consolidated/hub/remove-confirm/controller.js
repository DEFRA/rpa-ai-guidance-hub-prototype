const { guidanceDocuments } = require('../../../../data/guidance-documents')
const { TAB_LIST_NAMES } = require('../view-model')

function get(req, res) {
  const document = guidanceDocuments.find(
    (candidate) => candidate.id === req.query.id
  )

  res.render('consolidated/hub/remove-confirm/page.njk', {
    documentId: req.query.id,
    tabParam: req.query.tab,
    documentTitle: document ? document.title : null,
    listName: TAB_LIST_NAMES[req.query.tab] || null
  })
}

module.exports = { get }
