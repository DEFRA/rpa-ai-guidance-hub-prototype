# Plan 3: Heading-level case bookmarks

**Depends on:** Plan 2 (`findAnchor`, anchors `section-N`/`part-N`, pages).

## Context

Existing feature: "Bookmark to a case" links a whole guide to a case ID or SBI application number. Bookmarks show in the side nav's "Case bookmarks" (`app/data/side-nav.js`, session key `guideBookmarks`) and in the guide page's right-hand panel. The question page lives at `guide/bookmark/`.

On a 200-page guide, "this guide is relevant to CASE-10482" isn't precise enough. The user asked to:
1. bookmark at **section** level, with the bookmark control on each section heading;
2. then make it an **icon inline with the heading**, the side nav's bookmark icon;
3. then allow **every heading** to be bookmarked, subheadings included.

**Decisions**
- **One kind of bookmark.** Section bookmarks are the existing case bookmarks aimed more precisely, not a second "personal bookmark". Two kinds of "bookmark" on one page would confuse people.
- **Whole-guide bookmarking stays** in the panel.
- **One stable link format:** `/playground/guide/:id/section/:anchor`, which redirects to the right stepper page or traditional anchor for however this reader views the guide. Bookmarks, resume (Plan 4) and Recently opened all use it.
- **Deliberate simplification:** whole-guide and section bookmarks for the same guide aren't tracked separately. Removing a guide's last bookmarked section also takes the guide off that case.

## To do

**Data**
- [ ] 1. Check that no frozen snapshot `require`s `app/data/side-nav.js` before changing its data shape.
- [ ] 2. In `app/data/side-nav.js`:
  - backfill `sections: []` in `getBookmarks`;
  - give `addBookmark` a `section` argument;
  - give `removeBookmark` an `anchor` argument, including dropping the guide on its last section;
  - add and export `sectionHref(base, documentId, anchor)`.
- [ ] 3. In `buildSideNav`, give each case's guide its `sections: [{ label, href }]`.
- [ ] 4. Pass `req.body.anchor` through `case-bookmarks/remove/routes.js`.

**Routing**
- [ ] 5. Add `locateAnchor(id, anchor)` to `guide/view-model.js`, and export it with `readFormat` and `buildHref`.
- [ ] 6. Create `guide/section/routes.js` and `controller.js` for `GET /:id/section/:anchor`. Redirect to the stepper page or traditional anchor for this reader's format, or to the guide if the anchor is unknown.

**Guide page**
- [ ] 7. In `guide/view-model.js`:
  - add `buildSectionBookmarks(req, id)`;
  - spread `bookmarkFields(anchor)` (`bookmarkHref`, `bookmarkedTo`) into every section and part;
  - add `sections` to each panel case item in `buildCaseBookmarks`;
  - add `sectionLabel` to the success banner text.
- [ ] 8. Add the `bookmark-filled` icon to `partials/side-nav-icon.njk`.
- [ ] 9. In `partials/reading-content.njk`:
  - add the `headingBookmark(target, name)` and `bookmarkedTo(target)` macros;
  - wrap every heading in `.app-guide-heading-row` (with the `--sub` modifier for subheadings);
  - a section's first heading uses the section as its target.
- [ ] 10. In `partials/case-bookmarks.njk`, list the bookmarked headings under each case, each with a Remove form that posts `anchor`.
- [ ] 11. In `partials/side-nav.njk`, add the "› section" sub-links under each case's guide.

**Bookmark question page**
- [ ] 12. In `guide/bookmark/`:
  - the view model adds `returnHref`, `heading`, `hintText` and `cancelHref`;
  - the controller resolves `section` from the query or body via `locateAnchor`, passes it to `addBookmark`, sets `sectionLabel` in the flash and redirects to `returnHref`;
  - the template gets a hidden `section` input and dynamic heading, hint and button text.

**Styles and finish**
- [ ] 13. Add the SCSS to `_app-guide.scss` (heading row, icon button with pinned `:link`/`:visited` colour, tooltip, "Bookmarked to" line, panel list) and to `_app-side-nav.scss` (section list and link).
- [ ] 14. Run every step in Verification below: a section and a subheading bookmarked to different cases, the redirect in both formats, and remove.
- [ ] 15. Add dated entries to `guide/page.notes.md` and `guide/bookmark/page.notes.md`, then run `npm run format`.

## Resulting structure

```
app/data/side-nav.js                          edit — bookmarks gain `sections`; add/remove take a section; sectionHref()
app/views/partials/side-nav-icon.njk          edit — add "bookmark-filled"
app/views/partials/side-nav.njk               edit — "› section" sub-links under a case's guide
app/assets/sass/components/_app-side-nav.scss edit — .app-side-nav__section-list/-link
app/assets/sass/components/_app-guide.scss    edit — heading row, icon button, tooltip, "Bookmarked to" line, panel list
app/views/playground/case-bookmarks/remove/routes.js   edit — pass `anchor`
app/views/playground/guide/
  view-model.js                  edit — bookmarkFields per section/part, buildSectionBookmarks, panel sections, success text, locateAnchor
  partials/reading-content.njk   edit — headingBookmark + bookmarkedTo macros; heading rows
  partials/case-bookmarks.njk    edit — list bookmarked headings under each case, each removable
  bookmark/controller.js, view-model.js, page.njk, page.notes.md   edit — ?section= support
  section/routes.js + controller.js   new — GET /playground/guide/:id/section/:anchor → redirect
```

## Files in detail

### Data model: `app/data/side-nav.js`
The bookmark shape becomes `{ type, ref, documentIds: [...], sections: [{ documentId, anchor, label }] }`. `documentIds` still means "guides in this bookmark", so every existing reader (hub filter, side nav, Bookmarked guides list) works unchanged. `label` is stored so the side nav can show it without loading the guide.

```js
function getBookmarks(req) {
  if (!req.session.data.guideBookmarks) { /* …seed data unchanged… */ }
  // Backfilled for sessions from before section bookmarks.
  req.session.data.guideBookmarks.forEach((bookmark) => {
    bookmark.sections = bookmark.sections || []
  })
  return req.session.data.guideBookmarks
}

// `section` ({ anchor, label }, already validated against the guide by the
// caller) pins the bookmark to that section as well.
function addBookmark(req, type, rawRef, documentId, section) {
  // …existing validation unchanged (type, ref required/length/charset, guide exists)…
  let bookmark = findBookmark(req, type, ref)
  if (!bookmark) {
    bookmark = { type, ref, documentIds: [], sections: [] }
    getBookmarks(req).unshift(bookmark)
  }
  if (bookmark.documentIds.indexOf(documentId) === -1) bookmark.documentIds.push(documentId)
  if (
    section &&
    !bookmark.sections.some(
      (entry) => entry.documentId === documentId && entry.anchor === section.anchor
    )
  ) {
    bookmark.sections.push({ documentId, anchor: section.anchor, label: section.label })
  }
  return null
}

// No documentId: remove the whole bookmark. documentId: take that guide off.
// documentId + anchor: just that section — and the guide with it once it
// was the guide's last bookmarked section.
function removeBookmark(req, type, ref, documentId, anchor) {
  const bookmarks = getBookmarks(req)
  const index = bookmarks.findIndex((b) => b.type === type && b.ref === ref)
  if (index === -1) return
  if (!documentId) {
    bookmarks.splice(index, 1)
    return
  }
  const bookmark = bookmarks[index]
  const forGuide = (entry) => entry.documentId === documentId
  if (anchor) {
    bookmark.sections = bookmark.sections.filter((e) => !(forGuide(e) && e.anchor === anchor))
    if (bookmark.sections.some(forGuide)) return
  } else {
    bookmark.sections = bookmark.sections.filter((e) => !forGuide(e))
  }
  const ids = bookmark.documentIds
  const docIndex = ids.indexOf(documentId)
  if (docIndex !== -1) ids.splice(docIndex, 1)
  if (!ids.length) bookmarks.splice(index, 1)
}

// A link that lands on the right stepper page (or traditional anchor).
function sectionHref(base, documentId, anchor) {
  return `${documentHref(base, documentId)}/section/${encodeURIComponent(anchor)}`
}
```
- **Exports:** add `sectionHref`.
- **Side nav case entries:** in `buildSideNav`, each guide gains its sections:
  ```js
  sections: bookmark.sections
    .filter((entry) => entry.documentId === id)
    .map((entry) => ({ label: entry.label, href: sectionHref(base, id, entry.anchor) }))
  ```
- **Snapshots:** check that frozen snapshots don't `require` this module before changing its data shape. In this repo none do.

### `case-bookmarks/remove/routes.js`
```js
router.post('/', (req, res) => {
  removeBookmark(req, req.body.type, req.body.ref, req.body.documentId, req.body.anchor)
  res.redirect(safeReturnTo(req.body.returnTo))
})
```

### `guide/section/` (new): one stable link to any heading
```js
// routes.js
const router = govukPrototypeKit.requests.setupRouter('/playground/guide')
router.get('/:id/section/:anchor', controller.get)

// controller.js
const { locateAnchor, readFormat, buildHref } = require('../view-model')

function get(req, res) {
  const { id, anchor } = req.params
  const found = locateAnchor(id, anchor)
  if (!found) {
    res.redirect('/playground/guide/' + encodeURIComponent(id))
    return
  }
  const format = readFormat(req, id)
  res.redirect(
    buildHref(id, format, format === 'stepper' ? found.pageNumber : null) + '#' + found.anchor
  )
}
```
In `guide/view-model.js`, export `locateAnchor`, `readFormat` and `buildHref`:
```js
// The section/, position/ and bookmark/ modules' shared lookup.
function locateAnchor(id, anchor) {
  const { content } = loadGuideContent(id)
  return findAnchor(groupPages(content, getStepperPages(id)), anchor)
}
```

### Guide view model: bookmark data per heading
```js
// Which cases each heading of this guide is bookmarked to, by anchor.
function buildSectionBookmarks(req, id) {
  const byAnchor = {}
  getBookmarks(req).forEach((bookmark) => {
    bookmark.sections
      .filter((entry) => entry.documentId === id)
      .forEach((entry) => {
        byAnchor[entry.anchor] = byAnchor[entry.anchor] || []
        byAnchor[entry.anchor].push({ typeLabel: BOOKMARK_TYPES[bookmark.type].short, ref: bookmark.ref })
      })
  })
  return byAnchor
}

// inside guideViewModel:
const sectionBookmarks = buildSectionBookmarks(req, id)
// Any heading can be bookmarked: a section (section-N) or a subheading (part-N).
const bookmarkFields = (anchor) => ({
  bookmarkHref: `/playground/guide/${encodeURIComponent(id)}/bookmark?section=${anchor}`,
  bookmarkedTo: sectionBookmarks[anchor] || []
})
// spread ...bookmarkFields(section.id) into each section and ...bookmarkFields(part.id) into each part
```
- **Panel list:** `buildCaseBookmarks` gives each case item `sections: [{ anchor, label, href: sectionHref(base, id, anchor) }]` for this guide.
- **Success banner:** the flash gains `sectionLabel`, and `buildBookmarkSuccess` says `‘2.2 Check the review report’ bookmarked to SBI application number 123456789`, or `Guide bookmarked to …` for a whole-guide bookmark.

### Bookmark question page: `guide/bookmark/`
It's the same page with `?section=<anchor>`, and the anchor is validated through `locateAnchor`.
```js
// view-model.js
function returnHref(id, section) {
  const guide = `/playground/guide/${encodeURIComponent(id)}`
  return section ? `${guide}/section/${encodeURIComponent(section.anchor)}` : guide
}

function bookmarkPageViewModel(id, documentName, section, body, error) {
  // …existing error mapping…
  return {
    id, documentName, section,
    heading: section ? 'Bookmark this section to a case' : 'Bookmark this guide to a case',
    hintText: section
      ? `‘${section.label}’ in ${documentName} will show under that case in the side navigation.`
      : `${documentName} will show in that case's guide list on the side navigation.`,
    cancelHref: returnHref(id, section),
    // …existing fields…
  }
}

// controller.js (glue only — hrefs come from the view model)
const sectionFrom = (id, anchor) => (anchor ? locateAnchor(id, String(anchor)) : null)
// GET:  section = sectionFrom(id, req.query.section); backHref = returnHref(id, section)
// POST: section = sectionFrom(id, req.body.section); addBookmark(req, type, ref, id, section)
//       flash { documentId, type, ref, sectionLabel }; redirect(returnHref(id, section))
```
In `page.njk`:
- `pageName` and the legend use `heading`, and the hint uses `hintText`;
- add `{% if section %}<input type="hidden" name="section" value="{{ section.anchor }}">{% endif %}`;
- the button reads "Bookmark section" or "Bookmark guide", and Cancel goes to `cancelHref`.

### The inline icon: `reading-content.njk`
```njk
{% from "partials/side-nav-icon.njk" import sideNavIcon %}

{#
  A heading's bookmark: the side nav's bookmark icon beside the heading (a
  sibling, not inside it, so the heading text stays clean for screen
  readers and the contents list), filled once bookmarked to any case. Its
  accessible name is the visually hidden text; the tooltip is the side
  nav's own Esc-dismissable one (side-nav.js).
#}
{% macro headingBookmark(target, name) %}
  {% set isBookmarked = target.bookmarkedTo.length > 0 %}
  {% set label = "Bookmarked – add another case" if isBookmarked else "Bookmark to a case" %}
  <a class="app-guide-section-bookmark{{ ' app-guide-section-bookmark--active' if isBookmarked }}" href="{{ target.bookmarkHref }}" data-side-nav-tooltip>
    {{ sideNavIcon("bookmark-filled" if isBookmarked else "bookmark") }}
    <span class="govuk-visually-hidden">{{ label }}: {{ name }}</span>
    <span class="app-side-nav__tooltip app-guide-section-bookmark__tooltip" aria-hidden="true">{{ label }}</span>
  </a>
{% endmacro %}

{# Which cases a heading is bookmarked to, as text — a tooltip never shows on touch. #}
{% macro bookmarkedTo(target) %}
  {% if target.bookmarkedTo.length %}
    <p class="app-guide-section-bookmarked">
      Bookmarked to
      {% for bookmark in target.bookmarkedTo %}{{ bookmark.typeLabel }} {{ bookmark.ref }}{{ ", " if not loop.last }}{% endfor %}
    </p>
  {% endif %}
{% endmacro %}

{# A section's first part is the section's own heading, so its bookmark is
   the section's (section-N); every other part bookmarks itself (part-N). #}
{% macro renderPart(part, level=1, section=null, live=true) %}
  {% set target = section or part %}
  {% if level == 1 %}
    <div class="app-guide-heading-row">
      <h2 class="app-guide-heading-1" id="{{ part.id }}" data-guide-anchor="{{ part.id }}">
        {% if part.partName %}<span class="app-guide-part-heading__eyebrow">{{ part.partName }}</span>{% endif %}
        {{ part.heading }}
      </h2>
      {{ headingBookmark(target, section.sectionName if section else part.heading) }}
    </div>
  {% else %}
    <div class="app-guide-heading-row app-guide-heading-row--sub">
      <h3 class="app-guide-heading-2" id="{{ part.id }}" data-guide-anchor="{{ part.id }}">
        {% if part.partName %}<span class="app-guide-part-heading__eyebrow">{{ part.partName }}</span>{% endif %}
        {{ part.heading }}
      </h3>
      {{ headingBookmark(part, part.heading) }}
    </div>
  {% endif %}
  {{ bookmarkedTo(target) }}
  … Markdown / body rendering (Plan 1) …
{% endmacro %}
```
`data-guide-anchor` isn't needed by this plan; it's used by Plans 4 and 6.

### `side-nav-icon.njk`: add the filled variant (like `star-filled`)
```njk
{%- elif name == "bookmark-filled" -%}
  <path fill="currentColor" d="M5.5 3.5h9v13L10 13l-4.5 3.5z"/>
```

### `_app-guide.scss`
```scss
// A heading with its bookmark icon beside it. The row takes the heading's
// own margins. The icon is always visible (not hover-only) for keyboard
// and touch, and 36px square (WCAG 2.5.8).
.app-guide-heading-row {
  display: flex;
  align-items: center;
  gap: govuk-spacing(1);
  margin: govuk-spacing(6) 0 govuk-spacing(2);

  .app-guide-heading-1,
  .app-guide-heading-2 { margin: 0; }
}

.app-guide-heading-row--sub { margin: govuk-spacing(4) 0 govuk-spacing(2); }

.app-guide-section-bookmark {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;

  // Pinned for :visited too — a purple icon would read as "visited",
  // not as the bookmarked state the fill already shows.
  &:link,
  &:visited { color: $govuk-link-colour; }
  &:hover { background-color: $govuk-light-grey; color: $govuk-link-hover-colour; }
  &:focus { @include govuk-focused-text; }
}

// Reuses the side nav's tooltip; side-nav.js adds
// .app-side-nav__rail-item--tooltip-dismissed on Esc for any [data-side-nav-tooltip].
@include govuk-media-query($from: desktop) {
  .app-guide-section-bookmark:hover .app-guide-section-bookmark__tooltip,
  .app-guide-section-bookmark:focus-visible .app-guide-section-bookmark__tooltip { display: block; }
  .app-guide-section-bookmark.app-side-nav__rail-item--tooltip-dismissed .app-guide-section-bookmark__tooltip { display: none; }
}

.app-guide-section-bookmarked {
  margin: 0 0 govuk-spacing(3);
  color: $govuk-secondary-text-colour;
  font-size: 16px;
}

// Panel: a case's bookmarked headings, under the case.
.app-guide-panel__bookmark-sections { flex-basis: 100%; margin: 0 0 0 govuk-spacing(3); font-size: 16px; }
.app-guide-panel__bookmark-section {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: govuk-spacing(2);
  margin-bottom: govuk-spacing(1);
}
```
Side nav (`_app-side-nav.scss`):
```scss
.app-side-nav__section-list { margin: 0 0 govuk-spacing(1) govuk-spacing(2); padding: 0; list-style: none; }
.app-side-nav__section-link {
  @extend .app-side-nav__sublink;
  padding-top: 2px;
  padding-bottom: 2px;
  font-size: 13px;
  &:link, &:visited { color: $app-side-nav-muted; }
  &::before { content: '› '; }
}
```
- **Gotcha:** `@extend` of a rule that sets `&:link` colour beats a plain `color`, so repeat the `:link`/`:visited` override.
- **Gotcha:** the icon link's purple visited colour came from browser defaults. Pin it as above.

### Panel markup: `case-bookmarks.njk`, inside each case item
```njk
{% if bookmark.sections.length %}
  <ul class="govuk-list app-guide-panel__bookmark-sections" aria-label="Sections bookmarked to {{ bookmark.typeLabel }} {{ bookmark.ref }}">
    {% for section in bookmark.sections %}
      <li class="app-guide-panel__bookmark-section">
        <a class="govuk-link" href="{{ section.href }}">{{ section.label }}</a>
        <form method="post" action="{{ bookmark.removeHref }}">
          <input type="hidden" name="type" value="{{ bookmark.type }}">
          <input type="hidden" name="ref" value="{{ bookmark.ref }}">
          <input type="hidden" name="documentId" value="{{ id }}">
          <input type="hidden" name="anchor" value="{{ section.anchor }}">
          <input type="hidden" name="returnTo" value="{{ returnTo }}#guide-case-bookmarks">
          <button type="submit" class="govuk-link app-link-button govuk-body-s">Remove<span class="govuk-visually-hidden"> {{ section.label }} from {{ bookmark.typeLabel }} {{ bookmark.ref }}</span></button>
        </form>
      </li>
    {% endfor %}
  </ul>
{% endif %}
```

### Side nav markup: `side-nav.njk`, under each case's guide link
```njk
{% if guide.sections.length %}
  <ul class="app-side-nav__section-list" aria-label="Bookmarked sections of {{ guide.title }}">
    {% for section in guide.sections %}
      <li><a class="app-side-nav__section-link" href="{{ section.href }}">{{ section.label }}</a></li>
    {% endfor %}
  </ul>
{% endif %}
```

## Not covered

Headings nested inside a part's Markdown (`####` and deeper, rendered by TipTap) have no anchor and no icon. Adding them would mean assigning anchors inside TipTap's output, for example with a heading extension that sets ids.

## Verification
1. **Every heading has an icon:** 10 on the sample guide. All are outlines at first, each with a tooltip on hover and focus that Esc dismisses.
2. **Section bookmark:** click section 2's icon, then choose Case ID and enter CASE-10482. Check that:
   - you return to `#section-2` with the banner "‘2 Checking the claim’ bookmarked to case ID CASE-10482";
   - the icon is filled and "Bookmarked to Case CASE-10482" shows under the heading;
   - the panel lists the section under the case, and the side nav shows "› 2 Checking the claim".
3. **Subheading bookmark:** bookmark 2.2 to SBI 123456789. Its bookmark is stored against `part-6` and the two bookmarks stay independent.
4. **Section link:** `/section/part-6` in the stepper redirects to `?format=stepper&page=2#part-6`.
5. **Remove:** removing the section from the panel clears the icon, the text, the panel entry and the side-nav entry. When it was the guide's only section on that case, the guide leaves the case too.
6. **No regressions:** whole-guide bookmarking and the side nav's own remove still work.
