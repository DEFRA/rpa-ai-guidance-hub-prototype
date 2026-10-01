// The canonical quality-check pages — the consolidation plan's "no debate"
// decision, ported from /v2/designer/documents/issues + .../findings/:id.
// /v5/guidance-document/sfi-23, V6's in-editor Checks tab and the
// standalone /v6/guidance-document/:id are all retired; every "View
// issues"/"Start Checks" button in the 2026-10-01-side-nav-first-iteration build points here.
//
// res.locals.document/library/fixVariant (the quality-check state itself)
// are already set by app/views/legacy/routes.js' site-wide middleware,
// which runs ahead of every route including this one — reused as-is here,
// not rebuilt, same as V2's own routes already do. Only editorHref/
// stepThroughHref/fixHref (which page each button leads to) are
// overridden below, to point at the 2026-10-01-side-nav-first-iteration editor/step-through
// rather than that middleware's own retired-V2 defaults.

function withPlaygroundHrefs(res) {
  res.locals.editorHref = '/2026-10-01-side-nav-first-iteration/editor'
  res.locals.stepThroughHref =
    '/2026-10-01-side-nav-first-iteration/issues/findings'
  if (res.locals.fixVariant === 'editor') {
    res.locals.fixHref = '/2026-10-01-side-nav-first-iteration/editor'
  } else if (res.locals.fixVariant === 'step-through') {
    res.locals.fixHref = '/2026-10-01-side-nav-first-iteration/issues/findings'
  }
}

function getIssues(req, res) {
  withPlaygroundHrefs(res)
  res.render('2026-10-01-side-nav-first-iteration/issues/page.njk')
}

module.exports = { getIssues }
