const {
  getEditorExperimentReplies
} = require('../../../../data/editor-experiment')

function post(req, res) {
  const commentId = req.body && req.body.commentId
  const text = req.body && (req.body.text || '').trim()

  if (commentId && text) {
    const sessionReplies = getEditorExperimentReplies(req)
    if (!sessionReplies[commentId]) sessionReplies[commentId] = []
    sessionReplies[commentId].push({
      author: 'You',
      timestamp: 'Just now',
      text
    })
  }

  res.status(204).end()
}

module.exports = { post }
