//
// A guess at whether a search is a question for the AI search, rather than
// words to find: it ends with a question mark, or it starts with a question
// word and goes on past it.
//
// One file, loaded by the browser (the hub's "searching" message) and required
// by the hub's view model, so both make the same guess.
//
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.appQueryKind = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Asking words, and the verbs a yes-or-no question starts with.
  const QUESTION_WORDS = new Set([
    'how',
    'what',
    'when',
    'where',
    'which',
    'who',
    'whom',
    'whose',
    'why',
    'am',
    'is',
    'are',
    'was',
    'were',
    'do',
    'does',
    'did',
    'has',
    'have',
    'had',
    'can',
    'could',
    'should',
    'would',
    'will',
    'shall',
    'may',
    'might',
    'must'
  ])

  function isQuestion(query) {
    const text = query.trim()
    const words = text.toLowerCase().split(/\s+/)

    return (
      text.endsWith('?') || (words.length > 1 && QUESTION_WORDS.has(words[0]))
    )
  }

  return { isQuestion }
})
