// The experimental guidance viewer layout being trialled alongside the
// standard one (app/views/v6/guidance-document/) — reached from the
// "Traditional viewer" option on guidance-document-choice.html. Renders
// the exact duplicate at app/views/versions/v6/guidance-document-
// experiment.html, which — like the standard viewer's own template — has
// no per-document dynamic content yet, so :id is accepted (for parity
// with that route, and so the choice page can link here the same way it
// links to the standard viewer) but not used for anything.
function get(req, res) {
  res.render('versions/v6/guidance-document-experiment')
}

module.exports = { get }
