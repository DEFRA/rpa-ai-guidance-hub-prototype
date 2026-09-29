# Plan 5: Centred, wider, reader-sized reading page

**Depends on:** nothing, though it touches the same guide templates and SCSS as Plans 1–4.

## Context

Research: "the guide is easier to view in Word." The team's hypothesis: Word's page is **centred** and **wider**, where this viewer was left-aligned and narrow. The user asked for:
- **centre alignment**;
- **a wider page**;
- **a width the user can change**.

What was actually limiting the width: every block type capped itself separately at `max-width: 42em`. Because `em` follows each element's own font size, a 19px paragraph ended at about 800px, a 22px heading at about 924px, and the contents box at yet another width. Nothing lined up, and all of it sat against the left edge of the main column.

**Decisions**
- **One centred "page":** `.app-guide-reading` with a single width for everything on it, like a Word page.
- **Presets, not a drag handle:** Standard (960px, the new default), Wide (1200px) and Full width (fills the space between the side nav and the panel). Presets are easier to hit, keyboard-friendly, and easier to talk about in research.
- **A global reading preference:** saved in the session and applied to every guide, not per guide.
- **No-JS:** a form POST with one submit button per width, the same convention as the panel's collapse toggle.
- **Contents cap:** the contents list stays at 640px so it doesn't become a page-wide grey band.

## To do

- [ ] 1. In `_app-guide.scss`, remove every `max-width: 42em;` from the guide rules and delete any rules left empty.
- [ ] 2. Add `.app-guide-reading` (960px, `margin: auto`) and its `--wide` (1200px) and `--full` (none) modifiers, and cap `.app-guide-contents` at 640px.
- [ ] 3. Add the `.app-guide-tools` row styles and the `.app-guide-reading-width` control styles:
  - reset the button borders first, then re-add the `:not(:last-child)` separator;
  - give the buttons a focus style.
- [ ] 4. In `guide/view-model.js`, add `READING_WIDTHS`, `getReadingWidth` (default `standard`) and `setReadingWidth` (validated). Return `readingWidth`, `readingWidths` and `readingWidthHref`, and export `setReadingWidth`.
- [ ] 5. Create `guide/reading-width/routes.js`: `POST /` saves the width and redirects to `safeReturnTo(returnTo)`.
- [ ] 6. Write `partials/reading-width.njk`: one form, a labelled group, one submit button per width, and `aria-pressed` on the current one.
- [ ] 7. In `guide/page.njk`:
  - add the `app-guide-reading--{{ readingWidth }}` class;
  - wrap Pin guide and the width control in `.app-guide-tools`.
- [ ] 8. Run every step in Verification below: all three widths, persistence across guides, no-JS and a narrow screen.
- [ ] 9. Add a dated entry to `guide/page.notes.md`, then run `npm run format`.

## Resulting structure

```
app/assets/sass/components/_app-guide.scss    edit — remove every `max-width: 42em`; add page + control styles
app/views/playground/guide/
  view-model.js                                edit — READING_WIDTHS, get/setReadingWidth, model fields
  reading-width/routes.js                      new — POST /playground/guide/reading-width
  partials/reading-width.njk                   new — the "Page width" control
  page.njk                                     edit — modifier class on .app-guide-reading; tools row
  page.notes.md                                edit — dated entry
```

## Files in detail

### `_app-guide.scss`
1. **Remove every `max-width: 42em;`** from the guide rules:
   - `.app-guide-body-text`, `.app-guide-section`, `.app-guide-heading-1`, `.app-guide-heading-2` and `.app-guide-divider`;
   - `.app-guide-progress`, `.app-guide-contents`, `.app-guide-callout` and `.app-guide-branch`;
   - the heading row, "bookmarked to" and resume rules from Plans 3 and 4.

   Then delete any rules left empty.
2. **Add:**
```scss
// The reading "page": centred in the space between the side nav and the
// panel, one width for everything on it (title, contents, headings, body)
// so it all lines up like a Word page, rather than each block capping
// itself at its own em-based measure.
.app-guide-reading {
  max-width: 960px;
  margin-right: auto;
  margin-left: auto;
}

.app-guide-reading--wide { max-width: 1200px; }
.app-guide-reading--full { max-width: none; }

// The contents list stays a readable block, not a page-wide grey band.
.app-guide-reading .app-guide-contents { max-width: 640px; }

// Pin guide and Page width, on one row under the title.
.app-guide-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: govuk-spacing(2) govuk-spacing(4);
  margin-bottom: govuk-spacing(4);

  .app-pin-button { margin-bottom: 0 !important; } // overrides the partial's govuk-!-margin-bottom-4
}

.app-guide-reading-width { display: flex; align-items: center; gap: govuk-spacing(2); }
.app-guide-reading-width__label { font-size: 16px; font-weight: 700; }

// The format toggle's segmented look (.app-guide-format-toggle), on buttons rather than links.
.app-guide-reading-width__options {
  margin-bottom: 0;

  .app-guide-format-toggle__option {
    margin: 0;
    border: 0;
    background-color: $govuk-white;
    color: $govuk-black;
    cursor: pointer;

    &:not(:last-child) { border-right: 2px solid $govuk-black; }
  }

  .app-guide-format-toggle__option--active { background-color: $defra-green; color: $govuk-white; }
  .app-guide-format-toggle__option:focus { @include govuk-focused-text; }
}
```
**Gotcha:** these are `<button>`s reusing the link-based toggle's classes. Reset the browser's default button border first (`border: 0`), then re-add the separator with `&:not(:last-child)` **after** the reset. The two selectors have equal specificity, so source order decides, and resetting only three sides left a default outset border on the last button.

### `guide/view-model.js`
```js
// The reading page's width: a reader's own preference, so global rather
// than per-guide, saved by reading-width/routes.js.
const READING_WIDTHS = [
  { value: 'standard', text: 'Standard' },
  { value: 'wide', text: 'Wide' },
  { value: 'full', text: 'Full width' }
]

function getReadingWidth(req) {
  const width = req.session.data.guideReadingWidth
  return READING_WIDTHS.some((option) => option.value === width) ? width : 'standard'
}

function setReadingWidth(req, value) {
  if (READING_WIDTHS.some((option) => option.value === value)) {
    req.session.data.guideReadingWidth = value
  }
}

// in the returned model:
readingWidth: getReadingWidth(req),
readingWidths: READING_WIDTHS,
readingWidthHref: '/playground/guide/reading-width',

module.exports = { …, setReadingWidth }
```

### `guide/reading-width/routes.js`
```js
const govukPrototypeKit = require('govuk-prototype-kit')
const { setReadingWidth } = require('../view-model')
const { safeReturnTo } = require('../../../../data/side-nav')

// A plain form POST, so it works without JavaScript — the same convention
// as panel-toggle/routes.js.
const router = govukPrototypeKit.requests.setupRouter('/playground/guide/reading-width')

router.post('/', (req, res) => {
  setReadingWidth(req, req.body.width)
  res.redirect(safeReturnTo(req.body.returnTo))
})
```
`safeReturnTo` only allows same-site paths (`/^\/(?!\/)/`).

### `partials/reading-width.njk`
```njk
<form class="app-guide-reading-width" method="post" action="{{ readingWidthHref }}">
  <input type="hidden" name="returnTo" value="{{ returnTo }}">
  <span class="app-guide-reading-width__label" id="guide-reading-width-label">Page width</span>
  <div class="app-guide-format-toggle app-guide-reading-width__options" role="group" aria-labelledby="guide-reading-width-label">
    {% for option in readingWidths %}
      <button type="submit" name="width" value="{{ option.value }}"
        class="app-guide-format-toggle__option{{ ' app-guide-format-toggle__option--active' if option.value == readingWidth }}"
        aria-pressed="{{ 'true' if option.value == readingWidth else 'false' }}">{{ option.text }}</button>
    {% endfor %}
  </div>
</form>
```
Each option is its own submit button with `name="width"`, so no radios or JavaScript are needed. `aria-pressed` tells screen readers which is selected.

### `guide/page.njk`
```njk
<div class="app-guide-reading app-guide-reading--{{ readingWidth }}" data-guide-position-href="{{ positionHref }}">
  …byline, <h1>…
  <div class="app-guide-tools">
    {% set pinDocumentId = document.id %}
    {% include "partials/pin-button.njk" %}
    {% include "playground/guide/partials/reading-width.njk" %}
  </div>
  …
```

## Ideas raised but not built (ranked)
1. **A contents list that stays in view**, like Word's navigation pane, in the space either side of the centred page, highlighting where you are. It probably helps most with the "finding things" feedback.
2. **Text size control (A− / A+)**, working the same way as page width.
3. **A page that looks like a page:** white on light grey with a faint edge, like Word's print layout.
4. **Search within the guide** (see Plan 6's alternative).
5. **Download as Word or PDF.**

## Verification
1. **Standard:** the page is 960px, centred, with equal space either side between the side nav and the panel.
2. **Wide:** the page is 1200px and `aria-pressed` moves to Wide. The choice carries over to another guide.
3. **Full width:** the page fills the main column. The contents list stays at 640px or less.
4. **No-JS:** the buttons still switch width.
5. **Narrow screens:** the tools row wraps, and there's no horizontal scroll.
