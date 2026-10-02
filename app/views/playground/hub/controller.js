const viewModel = require('./view-model')

// Async because, with the guides API configured, fromSession fetches the
// live Prototype guides manifest fresh on this request (see
// app/data/guidance-documents/index.js's getRequestApiGuides) rather than
// reading it back off a module-level array — same principle as
// guide/controller.js's own get.
async function get(req, res) {
  res.render('playground/hub/page.njk', await viewModel.fromSession(req))
}

module.exports = { get }
