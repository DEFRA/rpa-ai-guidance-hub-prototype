const {
  getEditorExperimentDeletedCommentIds,
  getEditorExperimentReplies
} = require('../../../../data/editor-experiment')

function post(req, res) {
  const commentId = req.body && req.body.commentId

  if (commentId) {
    const deletedIds = getEditorExperimentDeletedCommentIds(req)
    if (!deletedIds.includes(commentId)) deletedIds.push(commentId)
    delete getEditorExperimentReplies(req)[commentId]
  }

  res.status(204).end()
}

module.exports = { post }
