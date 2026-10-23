//
// How a keyword search matches: as Word's Find does, anywhere in the text and
// in any case ("pay" finds "payment" and "repay"). Several words match as that
// phrase, with any space or line break between them.
//
// One file, loaded by the browser (the guide page's search) and required by
// the hub's search of every guide, so a result opens on the matches it counted.
//
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.appKeywordMatches = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // A search as the term to find: its words in lower case, one space between.
  function searchTermOf(text) {
    return text.toLowerCase().split(/\s+/).filter(Boolean).join(' ')
  }

  function isSpace(character) {
    return character !== undefined && character.trim() === ''
  }

  // Where the words come in order from `at`, with space between them: the end
  // of the last word, or -1 if they don't.
  function phraseEnd(lower, at, words) {
    let position = at

    for (const [index, word] of words.entries()) {
      if (index > 0) {
        if (!isSpace(lower[position])) return -1
        while (isSpace(lower[position])) position += 1
      }

      if (!lower.startsWith(word, position)) return -1
      position += word.length
    }

    return position
  }

  // Every match of a term (as searchTermOf gives it) in a text, as [start, end)
  // ranges in order.
  function matchesIn(text, term) {
    const words = term.split(' ').filter(Boolean)
    const lower = text.toLowerCase()
    const matches = []

    if (!words.length) return matches

    let at = lower.indexOf(words[0])

    while (at !== -1) {
      const end = phraseEnd(lower, at, words)
      const matched = end !== -1

      if (matched) matches.push([at, end])
      at = lower.indexOf(words[0], matched ? end : at + 1)
    }

    return matches
  }

  return { searchTermOf, matchesIn }
})
