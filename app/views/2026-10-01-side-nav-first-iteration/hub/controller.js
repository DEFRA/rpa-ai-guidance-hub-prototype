const viewModel = require('./view-model')

// Async because, with GUIDANCE_API_ENABLED on, fromSession fetches the
// live Prototype guides manifest fresh on this request (see
// app/data/guidance-documents/index.js's getGuidanceDocuments) rather than
// reading it back off a module-level array — same principle as
// guide/controller.js's own get.
async function get(req, res) {
  res.render(
    '2026-10-01-side-nav-first-iteration/hub/page.njk',
    await viewModel.fromSession(req)
  )
}

module.exports = { get }
