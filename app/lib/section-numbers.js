//
// How the guides API names a guide's sections, which its AI search results
// carry: by the heading's dotted number ("2.1 Allocating" is "2.1"), or by a
// slug of the heading where it has none ("Annex A – Case Types" is
// "annex-a-case-types").
//

// True for "2", "2.1" or "2.1.1": digits separated by single dots.
function isDottedNumber(value) {
  return String(value)
    .split('.')
    .every(
      (part) => part !== '' && [...part].every((c) => c >= '0' && c <= '9')
    )
}

// A heading's dotted number, or null when it has none.
function headingNumber(heading) {
  const words = String(heading).trim().split(/\s+/)
  return words.length > 1 && isDottedNumber(words[0]) ? words[0] : null
}

// The heading as lower-case ASCII letters and digits, hyphenated.
function headingSlug(heading) {
  const kept = [...String(heading).toLowerCase()]
    .map((c) => ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ? c : ' '))
    .join('')
  return kept.trim().split(/\s+/).filter(Boolean).join('-')
}

module.exports = { isDottedNumber, headingNumber, headingSlug }
