// Intra-document links in a guide's Markdown ("go to 2. Assign Case").
// Converted Word guides link to a heading by `#fragment`; the fragment is a
// slug of the heading, or a Word bookmark (`#_Toc123`) that means nothing
// here, so a link that misses falls back to the heading its text names.

// GitHub-style slug: lower-case, punctuation dropped, spaces to hyphens.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Comparable form of a heading or link text: words only, "1.2" == "1 2".
function normalise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// `targets` is [{ text, href }]. Rewrites `[label](#fragment)` links to the
// target's href, leaving any link that resolves to nothing untouched.
function resolveHashLinks(markdown, targets) {
  const bySlug = new Map()
  const byText = targets.map((target) => ({
    ...target,
    normalised: normalise(target.text)
  }))
  targets.forEach((target) => {
    const slug = slugify(target.text)
    if (!bySlug.has(slug)) bySlug.set(slug, target)
  })

  function resolve(label, fragment) {
    const direct = bySlug.get(decodeURIComponent(fragment).toLowerCase())
    if (direct) return direct

    // The longest heading the link text contains wins, so "2.1 Check" isn't
    // taken for "2 Check…" when both are named.
    const words = ' ' + normalise(label) + ' '
    let best = null
    byText.forEach((target) => {
      if (
        target.normalised &&
        words.includes(' ' + target.normalised + ' ') &&
        (!best || target.normalised.length > best.normalised.length)
      ) {
        best = target
      }
    })
    return best
  }

  return markdown.replace(
    /\[((?:\\.|[^\]\\])+)\]\(#([^)\s]*)\)/g,
    (link, label, fragment) => {
      const target = resolve(label, fragment)
      return target ? `[${label}](${target.href})` : link
    }
  )
}

module.exports = { slugify, resolveHashLinks }
