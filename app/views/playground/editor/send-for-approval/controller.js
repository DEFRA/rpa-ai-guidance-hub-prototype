const {
  getAddedAwaitingApprovalIds,
  lookupAnyManageGuidanceDocument
} = require('../../../../data/manage-guidance')

// "Send for approval" (sidebar button) — captures the editor's current live
// content first (same fetch, same payload shape, as Preview — see
// editor/page.njk's pageScripts), then navigates here rather than acting
// immediately: a review step before the status actually changes. Ported
// from the now-retired /v6/editor-2-3-view, whose own version of this route
// already closed the gap the consolidation plan's crawl found — no editor
// continued past "Send for approval" before this.
function get(req, res) {
  const preview = req.session.data.editorExperimentPreview

  if (!preview) {
    res.redirect('/playground/editor')
    return
  }

  const document = preview.id
    ? lookupAnyManageGuidanceDocument(preview.id)
    : null

  res.locals.backHref =
    '/playground/editor' +
    (preview.id ? '?id=' + encodeURIComponent(preview.id) : '')
  res.locals.backLinkText = 'Back to editor'

  res.render('playground/editor/send-for-approval/page.njk', {
    id: preview.id,
    documentName: preview.title || 'SFI 23 Guidance document',
    description: document
      ? document.description
      : 'No description is available for this sample document.',
    sections: preview.steps
  })
}

// The confirmation page's own "Send for approval" button — the real state
// change: adds the id to req.session.data.manageGuidanceAwaitingApprovalAddedIds,
// so buildManageGuidanceRows moves this row out of Editing and into
// Awaiting approval for the rest of the session — visible immediately on
// its document overview page and the hub's own Awaiting approval tab. A
// fixed-sample draft (no real id) has nothing to move, so this just returns
// to the editor for that case.
function post(req, res) {
  const preview = req.session.data.editorExperimentPreview
  const id = (preview && preview.id) || ''

  if (!id) {
    res.redirect('/playground/editor')
    return
  }

  const addedIds = getAddedAwaitingApprovalIds(req)
  if (addedIds.indexOf(id) === -1) addedIds.push(id)

  res.redirect('/playground/document/' + encodeURIComponent(id))
}

module.exports = { get, post }
