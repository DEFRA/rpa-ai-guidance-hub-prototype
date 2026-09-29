const { BOOKMARK_TYPES } = require('../../../../data/side-nav')

// One named field per radio option (caseRef, sbiRef), not a single field
// shared by both conditional reveals — a GOV.UK Frontend conditional
// reveal only hides the other option's input with CSS, so a shared name
// would still submit both and collide. See gds-components' own
// conditional-reveal example (contactByEmail/contactByPhone/contactByText).
const FIELD_NAMES = { case: 'caseRef', sbi: 'sbiRef' }

const REF_HINTS = {
  case: 'For example, CASE-10482',
  sbi: 'For example, 123456789'
}

function refFromBody(type, body) {
  return (body[FIELD_NAMES[type]] || '').trim()
}

// Maps addBookmark's generic { field: "type"|"ref", text } error onto
// this page's two real ref field names.
function mapError(error, type) {
  if (!error) return null
  if (error.field === 'type') {
    return { field: 'type', text: error.text, href: '#bookmark-type' }
  }
  const suffix = type === 'sbi' ? 'sbi' : 'case'
  return {
    field: FIELD_NAMES[suffix],
    text: error.text,
    href: `#bookmark-ref-${suffix}`
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
function bookmarkPageViewModel(id, documentName, section, body, error) {
  const type = body.type || ''
  const mapped = mapError(error, type)
  const errors = {}
  if (mapped) errors[mapped.field] = { text: mapped.text }

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
    types: Object.keys(BOOKMARK_TYPES).map((key) => ({
      value: key,
      label: BOOKMARK_TYPES[key].label,
      hint: REF_HINTS[key]
    })),
    type,
    caseRef: body.caseRef || '',
    sbiRef: body.sbiRef || '',
    errors,
    errorList: mapped ? [{ text: mapped.text, href: mapped.href }] : []
  }
}

module.exports = { bookmarkPageViewModel, refFromBody, returnHref }
