const { BOOKMARK_TYPES } = require('../../../../data/side-nav')

// One named field per radio option (caseRef, sbiRef), not a single field
// shared by both conditional reveals — a GOV.UK Frontend conditional
// reveal only hides the other option's input with CSS, so a shared name
// would still submit both and collide. See gds-components' own
// conditional-reveal example (contactByEmail/contactByPhone/contactByText).
// The same goes for each type's existing-or-new choice and its dropdown.
const FIELDS = {
  case: { ref: 'caseRef', choice: 'caseChoice', existing: 'caseExisting' },
  sbi: { ref: 'sbiRef', choice: 'sbiChoice', existing: 'sbiExisting' }
}

const REF_HINTS = {
  case: 'For example, CASE-10482',
  sbi: 'For example, 123456789'
}

// Each type's references already bookmarked, in the side nav's order.
function existingRefs(bookmarks) {
  const refs = { case: [], sbi: [] }
  bookmarks.forEach((bookmark) => {
    if (refs[bookmark.type]) refs[bookmark.type].push(bookmark.ref)
  })
  return refs
}

// The reference the form chose — an existing one from the dropdown, or a
// new one typed in — or an error { field, text, href } for this page. With
// no existing references of the type there's no choice: it's a new one.
function refFromBody(type, body, bookmarks) {
  const fields = FIELDS[type]
  if (!fields) return { ref: '' }
  const existing = existingRefs(bookmarks)[type]
  const label = BOOKMARK_TYPES[type].label
  const choice = existing.length ? body[fields.choice] : 'new'

  if (choice === 'existing') {
    const ref = body[fields.existing] || ''
    if (existing.indexOf(ref) === -1) {
      return {
        error: {
          field: fields.existing,
          text: `Select an existing ${label}`,
          href: `#bookmark-existing-${type}`
        }
      }
    }
    return { ref }
  }
  if (choice !== 'new') {
    return {
      error: {
        field: fields.choice,
        text: `Select if you are bookmarking to an existing ${label} or a new one`,
        href: `#bookmark-${type}-choice`
      }
    }
  }
  return { ref: (body[fields.ref] || '').trim() }
}

// Maps addBookmark's generic { field: "type"|"ref", text } error onto
// this page's real field names; refFromBody's errors already use them.
function mapError(error, type) {
  if (!error || error.href) return error
  if (error.field === 'type') {
    return { field: 'type', text: error.text, href: '#bookmark-type' }
  }
  const key = type === 'sbi' ? 'sbi' : 'case'
  return {
    field: FIELDS[key].ref,
    text: error.text,
    href: `#bookmark-ref-${key}`
  }
}

// Back, Cancel and the post-submit redirect all return to the section
// being bookmarked (via guide/section/), not the top of the guide.
function returnHref(id, section) {
  const guide = `/playground/guide/${encodeURIComponent(id)}`
  return section
    ? `${guide}/section/${encodeURIComponent(section.anchor)}`
    : guide
}

// `section` ({ anchor, label }) makes this a section bookmark: the same
// question, asked about one section rather than the whole guide.
function bookmarkPageViewModel(
  id,
  documentName,
  section,
  bookmarks,
  body,
  error
) {
  const type = body.type || ''
  const mapped = mapError(error, type)
  const errors = {}
  if (mapped) errors[mapped.field] = { text: mapped.text }
  const existing = existingRefs(bookmarks)

  return {
    id,
    documentName,
    section,
    heading: section
      ? 'Bookmark this section to a case'
      : 'Bookmark this guide to a case',
    hintText: section
      ? `‘${section.label}’ in ${documentName} will show under that case in the side navigation.`
      : `${documentName} will show in that case's guide list on the side navigation.`,
    cancelHref: returnHref(id, section),
    types: Object.keys(BOOKMARK_TYPES).map((key) => {
      const fields = FIELDS[key]
      const label = BOOKMARK_TYPES[key].label
      const selected = body[fields.existing] || ''
      return {
        value: key,
        label,
        hint: REF_HINTS[key],
        fields,
        ref: body[fields.ref] || '',
        choice: body[fields.choice] || '',
        hasExisting: existing[key].length > 0,
        existingItems: [{ value: '', text: `Select a ${label}` }]
          .concat(existing[key].map((ref) => ({ value: ref, text: ref })))
          .map((item) => ({ ...item, selected: item.value === selected }))
      }
    }),
    type,
    errors,
    errorList: mapped ? [{ text: mapped.text, href: mapped.href }] : []
  }
}

module.exports = { bookmarkPageViewModel, refFromBody, returnHref }
