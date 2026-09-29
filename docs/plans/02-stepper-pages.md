# Plan 2: Stepper pages (groups of sections) and traditional fixes

**Depends on:** Plan 1 (lead parts, `loadGuideContent`).

## Context

Source guides run to 200 Word pages. The stepper used to step one **part** (subheading) at a time, which on a long guide means hundreds of Previous/Next clicks and a progress bar that barely moves. Research also criticised v6's continuous traditional view for making things hard to find and easy to lose your place in.

**Decisions made with the user**
- **Traditional stays** as one continuous page.
- **The stepper steps through "pages":** each page is a group of whole top-level sections. The grouping lives in **guide metadata**, defaulting to one section per page. Grouping is per guide because some Word guides have very short top-level sections.
- **Old links keep working:** research links use `?step=N` (part number) and must resolve to the page holding that part.

**Traditional bugs fixed along the way**
1. **Missing section names.** Sections with no lead-in text never showed their name in the body. Fixed by Plan 1's always-present lead part.
2. **False "current" item.** Traditional's contents list marked a "current" part. The stepper's state leaked into traditional, where everything is on one page.

## To do

- [ ] 1. Add `STEPPER_PAGES_BY_ID` and `getStepperPages(id)` to `app/data/guide-metadata.js`, and export it. Give the sample guide a grouping: `[1]`, then `[2, 3]` titled "Checking and finishing".
- [ ] 2. Add `groupPages(content, groups)` to `app/data/guide-content.js`: default one section per page, with unlisted sections appended as their own pages. Export it.
- [ ] 3. Add `findAnchor(pages, anchor)` to `app/data/guide-content.js`: resolve a `section-N` or `part-N` anchor to `{ anchor, pageNumber, label }`, or `null`. Export it.
- [ ] 4. In `guide/view-model.js`:
  - change `buildHref(id, format, page)` to take `?page=` instead of `?step=`;
  - compute `pages`, `totalPages`, `pageNumber` (from `?page=`, else resolve a legacy `?step=` part number, else 1) and `pageNumberBySection`.
- [ ] 5. Build hrefs by page:
  - traditional uses `#anchor`;
  - the stepper uses `?format=stepper&page=P#anchor`, for sections, parts and branch targets.
- [ ] 6. Add `isCurrent` (stepper only), `pageNumber` and `contentsParts` (excluding `isLead` parts) to each section.
- [ ] 7. Build the page list with per-page `prevLink` and `nextLink` labelled by page title. Return `pageNumber` and `totalPages`, and make `trackRecentlyOpened` require no `page`/`step` query.
- [ ] 8. In `partials/reading-content.njk`:
  - add the `renderSection(section, live)` macro;
  - make one contents list shared by both formats, using `section.isCurrent` and `contentsParts`;
  - traditional renders every section, and the stepper renders the current page's sections with "Page X of Y", a progress bar and pagination.
- [ ] 9. Run every step in Verification below, including a JS-content guide and a legacy `?step=` link.
- [ ] 10. Add a dated entry to `guide/page.notes.md`, then run `npm run format`.

## Resulting structure

```
app/data/guide-metadata.js        edit — STEPPER_PAGES_BY_ID + getStepperPages(id)
app/data/guide-content.js         edit — groupPages(content, groups), findAnchor(pages, anchor)
app/views/playground/guide/
  view-model.js                   edit — page-based stepper, ?step= compat, hrefs by page, contents state
  partials/reading-content.njk    edit — renderSection macro; one contents list; page-based stepper
  page.notes.md                   edit — dated entry
```

## Files in detail

### `app/data/guide-metadata.js`
```js
// How the stepper groups a guide's top-level sections into pages (by
// section number), for guides where one section per page is too fine.
// A guide with no entry gets one section per page (guide-content.js's
// groupPages). Would be set at upload in the real service.
const STEPPER_PAGES_BY_ID = {
  'sfi-nutrient-management-actions': [
    { sections: [1] },
    { title: 'Checking and finishing', sections: [2, 3] }
  ]
}

function getStepperPages(id) {
  return STEPPER_PAGES_BY_ID[id] || null
}

module.exports = { getGuideMetadata, getStepperPages }
```
In the real service this belongs in the guide's stored metadata, set during upload or editing. Possibly it could be suggested automatically from section lengths.

### `app/data/guide-content.js`: `groupPages` and `findAnchor`
```js
// The stepper's "pages": groups of whole sections, from the guide's
// metadata or one section per page by default. A section a grouping leaves
// out gets a page of its own at the end, so a mistyped grouping never
// hides content.
function groupPages(content, groups) {
  const byNumber = {}
  content.sections.forEach((section) => {
    byNumber[section.sectionNumber] = section
  })

  const used = {}
  const pages = []
  ;(groups || []).forEach((group) => {
    const sections = group.sections
      .map((number) => byNumber[number])
      .filter((section) => section && !used[section.sectionNumber])
    if (!sections.length) return
    sections.forEach((section) => {
      used[section.sectionNumber] = true
    })
    pages.push({ title: group.title || sections[0].sectionName, sections })
  })

  content.sections
    .filter((section) => !used[section.sectionNumber])
    .forEach((section) => {
      pages.push({ title: section.sectionName, sections: [section] })
    })

  return pages.map((page, index) => ({ ...page, pageNumber: index + 1 }))
}

// Where a section-N / part-N anchor lives: its page, and a label for it
// (the part's heading, or the section's name) — or null if it isn't one
// of this guide's.
function findAnchor(pages, anchor) {
  for (const page of pages) {
    for (const section of page.sections) {
      if (section.id === anchor) {
        return { anchor, pageNumber: page.pageNumber, label: section.sectionName }
      }
      const part = section.parts.find((candidate) => candidate.id === anchor)
      if (part) return { anchor, pageNumber: page.pageNumber, label: part.heading }
    }
  }
  return null
}

module.exports = { buildGuideContent, loadGuideContent, groupPages, findAnchor }
```
- **Anchors:** these are the ids `fromSections` already assigns: `section-N` for a section's wrapper and `part-N` for each heading.
- **`findAnchor`** becomes the single lookup that bookmarks, resume and the `section/` redirect (Plans 3 and 4) all build on.

### `guide/view-model.js`: `guideViewModel` (the page-related parts)
```js
const { loadGuideContent, groupPages, findAnchor } = require('../../../data/guide-content')
const { getGuideMetadata, getStepperPages } = require('../../../data/guide-metadata')

function buildHref(id, format, page) {
  const params = new URLSearchParams({ format })
  if (page) params.set('page', page)
  return '/playground/guide/' + encodeURIComponent(id) + '?' + params.toString()
}

// inside guideViewModel(req, id):
const { guidanceDocument, content } = loadGuideContent(id)

const pages = groupPages(content, getStepperPages(id))
const totalPages = pages.length
const pageOfPart = (partNumber) => {
  const part = content.flatParts[partNumber - 1]
  const found = part && findAnchor(pages, part.id)
  return found ? found.pageNumber : 1
}
const requestedPage = parseInt(req.query.page, 10)
const pageNumber =
  requestedPage >= 1 && requestedPage <= totalPages
    ? requestedPage
    : req.query.step
      ? pageOfPart(parseInt(req.query.step, 10))
      : 1
const pageNumberBySection = {}
pages.forEach((page) => {
  page.sections.forEach((section) => {
    pageNumberBySection[section.sectionNumber] = page.pageNumber
  })
})

// Traditional links to the in-page anchor; the stepper to the anchor on
// the page that holds it.
const pageHref = (number) => buildHref(id, 'stepper', number)
const anchorHref = (item) =>
  format === 'traditional'
    ? '#' + item.id
    : pageHref(pageNumberBySection[item.sectionNumber]) + '#' + item.id

const sections = content.sections.map((section) => ({
  ...section,
  href: anchorHref(section),
  // Only the stepper has a "current" place in the contents list.
  isCurrent: format !== 'traditional' && pageNumberBySection[section.sectionNumber] === pageNumber,
  pageNumber: pageNumberBySection[section.sectionNumber],
  // A section's lead part *is* the section, so only later parts are listed.
  contentsParts: section.parts.filter((part) => !part.isLead),
  parts: section.parts.map((part) => ({ ...part, href: anchorHref(part), body: resolveBody(part.body) }))
}))
```
- **Branch options** (JS-content guides) resolve their target part through `anchorHref`, so they land on the right page.
- **Return values:** `content: { sections }`, `pageNumber`, `totalPages`, and the page list (`stepperPages`, below).
- **Recently opened:** `trackRecentlyOpened` now requires `!req.query.page && !req.query.step`.

Page list with its own Previous/Next. This is the final shape after Plan 6; before Plan 6 only the current page is needed:
```js
const stepperPages = pages.map((page) => ({
  pageNumber: page.pageNumber,
  title: page.title,
  isCurrent: page.pageNumber === pageNumber,
  sections: page.sections.map((section) => sections[section.sectionNumber - 1]),
  prevLink: page.pageNumber > 1
    ? { href: pageHref(page.pageNumber - 1), labelText: pages[page.pageNumber - 2].title }
    : null,
  nextLink: page.pageNumber < totalPages
    ? { href: pageHref(page.pageNumber + 1), labelText: pages[page.pageNumber].title }
    : null
}))
```
Pagination labels come from data (the page title), not template arithmetic.

### `partials/reading-content.njk`
```njk
{#
  A whole section: its first part as the section's heading (for a
  converted guide that's the section's lead part, headed with its own
  name), then every other part as a subheading.
#}
{% macro renderSection(section, live=true) %}
  <div class="app-guide-section" id="{{ section.id }}">
    {% for part in section.parts %}
      {{ renderPart(part, 1 if loop.first else 2, section if loop.first else null, live) }}
    {% endfor %}
  </div>
{% endmacro %}

{# One contents list for both formats. Only the stepper has a "current" state. #}
<nav class="app-guide-contents" aria-labelledby="guide-contents-heading">
  <h2 class="govuk-heading-s" id="guide-contents-heading">Contents</h2>
  {% for section in content.sections %}
    <p class="app-guide-contents__section{{ ' app-guide-contents__section--current' if section.isCurrent }}"{% if format != "traditional" %} data-guide-contents-page="{{ section.pageNumber }}"{% endif %}>
      <a class="govuk-link app-guide-contents__section-link" href="{{ section.href }}"{% if section.isCurrent %} aria-current="true"{% endif %}>{{ section.sectionName }}</a>
    </p>
    {% if section.contentsParts.length %}
      <ol class="govuk-list app-guide-contents__list">
        {% for part in section.contentsParts %}
          <li><a class="govuk-link app-guide-contents__link" href="{{ part.href }}">{{ part.partName or part.heading }}</a></li>
        {% endfor %}
      </ol>
    {% endif %}
  {% endfor %}
</nav>

{% if format == "traditional" %}
  {% for section in content.sections %}
    {% if not loop.first %}{{ sectionDivider() }}{% endif %}
    {{ renderSection(section) }}
  {% endfor %}
{% else %}
  {# Before Plan 6: render only the current page. Plan 6 renders all of them. #}
  <p class="app-guide-section__eyebrow">Page {{ pageNumber }} of {{ totalPages }}</p>
  <div class="app-progress__track app-guide-progress" role="presentation">
    <div class="app-progress__bar" style="width: {{ (pageNumber / totalPages * 100) | round }}%"></div>
  </div>
  … current page's sections via renderSection, dividers between, then govukPagination(prevLink/nextLink) …
{% endif %}
```
- **Gotcha:** don't build the "current" set in Nunjucks by pushing into an array. Compute `isCurrent` in the view model; the template-side version was fragile.
- **Pagination:** `govukPagination` gets `labelText` from the page titles.

## Verification
1. **Sample guide in the stepper:** 2 pages, with page 2 holding sections 2 and 3.
   - "Page 2 of 2" shows, and Previous is labelled "1 Overview".
   - The contents list marks both of page 2's sections current (`aria-current`).
2. **Old links:** `?format=stepper&step=5` lands on page 2.
3. **Traditional:** "2 Checking the claim" and "3 Finishing the check" appear as headings, and the contents list has no current or bold item.
4. **JS-content guides:** `cs-revenue-claims-processing-final-payment-guide` gives "Page 1 of 4" with one section per page. Branch links still resolve.
