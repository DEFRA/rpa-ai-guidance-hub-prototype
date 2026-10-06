const { issuesViewModel } = require('./view-model')

function getIssues(req, res) {
  res.render('playground/issues/page.njk', issuesViewModel(req, req.params.id))
}

module.exports = { getIssues }
