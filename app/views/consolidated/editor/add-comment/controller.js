const {
  getEditorExperimentAddedComments
} = require('../../../../data/editor-experiment')

function post(req, res) {
  const commentId = req.body && req.body.commentId
  const anchorId = req.body && req.body.anchorId
  const sectionId = req.body && req.body.sectionId
  const text = req.body && (req.body.text || '').trim()
  const selectedText = req.body && req.body.selectedText

  if (commentId && anchorId && sectionId && text && selectedText) {
    getEditorExperimentAddedComments(req).push({
      id: commentId,
      author: 'You',
      timestamp: 'Just now',
      text,
      sectionId,
      anchorId,
      selectedText
    })
  }

  res.status(204).end()
}

module.exports = { post }
