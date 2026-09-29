# Plan 6: Ctrl+F across every stepper page (`hidden="until-found"`)

**Depends on:** Plan 1 (viewer mounts only where a JSON `<script>` is present; `app/lib/markdown-fallback.js`), Plan 2 (`stepperPages` with per-page Previous/Next), Plan 4 (`guide-position.js` must skip hidden headings).

## Context

Research criticised the stepper for the **lack of Ctrl+F**: the browser can only find text that's in the page, and the stepper only sent the current page's sections.

**Options considered**
1. **Chosen: keep the browser's own Ctrl+F.** Render every page, and hide the non-current ones with `hidden="until-found"`. The browser's find-in-page still searches content hidden that way. On a match it fires `beforematch` on the hidden element and reveals it, and we turn that into a proper page change.
   - **Support:** Chromium since 2022 (Chrome and Edge; Edge is the Defra laptop browser). I believe recent Firefox supports it too; Safari doesn't yet. Check current compatibility data before relying on it.
   - **Unsupported browsers** treat it as plain `hidden`, so find covers the current page only, as before. No breakage.
2. **Rejected for now:** a "Search this guide" box. A server-side search over `loadGuideContent` returns matching headings with snippets, and each result links to `…/section/<anchor>#:~:text=<query>` (a scroll-to-text fragment). It works in every browser and gives a full list of matches, but it's a separate feature. Don't take over Ctrl+F itself; overriding the browser's find annoys people and has accessibility problems.

**Key design constraints**
- **Revealed pages keep the server-rendered HTML** instead of mounting TipTap. Swapping the DOM under the browser's find highlight loses the match and breaks "find next". So:
  - only the **current** page gets the JSON `<script>` the viewer mounts from (Plan 1's `viewer.js` mounts nothing without it);
  - `markdown-fallback.js` must match TipTap's output: colour spans, `==highlight==` and lists in table cells.
- **200-page guides:** this also stops 200 TipTap editors starting at once, since the viewer only runs on the current page.
- **The switch has to update everything a real page change does:** hide the previous page, update `?page=`, and move the contents list's current mark. Each page block carries its own "Page X of Y", progress bar and Previous/Next, so switching page is just swapping which block is visible.

## To do

- [ ] 1. Check that browser support for `hidden="until-found"` and `beforematch` covers the research browsers (Edge first).
- [ ] 2. Confirm Plan 1's `markdown-fallback.js` matches TipTap for colour spans, highlights and lists in table cells. Found pages show this HTML.
- [ ] 3. In `guide/view-model.js`:
  - return `stepperPages` for **every** page (`pageNumber`, `title`, `isCurrent`, `sections`, own `prevLink`/`nextLink`) instead of only the current page;
  - add `pageNumber` to each section.
- [ ] 4. In `partials/reading-content.njk`:
  - thread a `live` flag through `renderSection` and `renderPart`;
  - emit the JSON `<script>` only when `live`;
  - add `data-guide-contents-page` to the stepper's contents entries.
- [ ] 5. Render every stepper page as `.app-guide-page[data-guide-page]` with its own eyebrow, progress, sections and pagination. Non-current pages get `hidden="until-found"` and render with `live = false`.
- [ ] 6. Write `app/assets/javascripts/guide-pages.js`. On `beforematch`:
  - re-hide the other pages;
  - `replaceState` to `?page=N` and drop `step`;
  - move the contents list's current class and `aria-current`.
- [ ] 7. Load `guide-pages.js` in `page.njk` after the TipTap bundle and before `guide-position.js`.
- [ ] 8. Make sure `guide-position.js` ignores headings inside `[hidden]` (Plan 4).
- [ ] 9. Run every step in Verification below: a text fragment into a hidden page, then real Ctrl+F by hand in Edge, Chrome, Firefox and Safari.
- [ ] 10. Measure the page weight with a real long guide if one is available.
- [ ] 11. Add a dated entry to `guide/page.notes.md`, then run `npm run format`.

## Resulting structure

```
app/assets/javascripts/guide-pages.js           new — beforematch → page switch
app/assets/javascripts/guide-position.js        edit — ignore headings inside [hidden] (Plan 4)
app/lib/markdown-fallback.js                    (Plan 1) — must match TipTap: colour, highlight, cell lists
app/views/playground/guide/
  view-model.js                                 edit — stepperPages (all pages, each with prev/next); section.pageNumber
  partials/reading-content.njk                  edit — render every page; `live` flag; data-guide-contents-page
  page.njk                                      edit — load guide-pages.js
  page.notes.md                                 edit — dated entry
```

## Files in detail

### View model
- **`stepperPages`:** replaces the single `currentPage`/`prevLink`/`nextLink`. See Plan 2 for the full mapping: `pageNumber`, `title`, `isCurrent`, `sections` and per-page `prevLink`/`nextLink`.
- **`pageNumber` on each section** (`pageNumber: pageNumberBySection[section.sectionNumber]`) lets the script move the contents list's current mark.

### `partials/reading-content.njk`: stepper branch
```njk
{#
  Every page is in the HTML, not just the current one: the rest are
  hidden="until-found", which hides them like [hidden] but still lets the
  browser's find-in-page (Ctrl+F) search them and, on a match, reveal that
  page (guide-pages.js then hides the one you were on). Where a browser
  doesn't support until-found they behave as plain [hidden]. Each page
  carries its own progress and Previous/Next.
#}
{% for page in stepperPages %}
  <div class="app-guide-page" data-guide-page="{{ page.pageNumber }}"{% if not page.isCurrent %} hidden="until-found"{% endif %}>
    <p class="app-guide-section__eyebrow">Page {{ page.pageNumber }} of {{ totalPages }}</p>
    <div class="app-progress__track app-guide-progress" role="presentation">
      <div class="app-progress__bar" style="width: {{ (page.pageNumber / totalPages * 100) | round }}%"></div>
    </div>

    {% for section in page.sections %}
      {% if not loop.first %}{{ sectionDivider() }}{% endif %}
      {{ renderSection(section, page.isCurrent) }}
    {% endfor %}

    {% if page.prevLink or page.nextLink %}
      {{ govukPagination({
        previous: { href: page.prevLink.href, labelText: page.prevLink.labelText } if page.prevLink else null,
        next: { href: page.nextLink.href, labelText: page.nextLink.labelText } if page.nextLink else null
      }) }}
    {% endif %}
  </div>
{% endfor %}
```
`live` is threaded through `renderSection(section, live)` into `renderPart(…, live)`, and the Markdown block becomes:
```njk
<div class="app-guide-markdown app-guide-body-text" data-tiptap-markdown>
  {% if live %}<script type="application/json">{{ part.markdown | jsonScript }}</script>{% endif %}
  <div class="app-guide-markdown__fallback">{{ part.markdown | markdownFallback }}</div>
</div>
```
Contents entries carry their page:
```njk
<p class="app-guide-contents__section{{ ' app-guide-contents__section--current' if section.isCurrent }}"{% if format != "traditional" %} data-guide-contents-page="{{ section.pageNumber }}"{% endif %}>
```
Traditional renders every section with `live = true` (the default).

### `app/assets/javascripts/guide-pages.js`
```js
;(function () {
  const pages = Array.from(document.querySelectorAll('[data-guide-page]'))
  if (pages.length < 2) return

  function showPage(page) {
    pages.forEach((other) => {
      if (other !== page) other.setAttribute('hidden', 'until-found')
    })
    page.removeAttribute('hidden')

    const number = page.getAttribute('data-guide-page')

    // Replace rather than push: find can hop across many pages, and each
    // hop shouldn't become a Back step.
    const url = new URL(window.location.href)
    url.searchParams.set('page', number)
    url.searchParams.delete('step')
    window.history.replaceState(window.history.state, '', url)

    document.querySelectorAll('[data-guide-contents-page]').forEach((entry) => {
      const current = entry.getAttribute('data-guide-contents-page') === number
      entry.classList.toggle('app-guide-contents__section--current', current)
      const link = entry.querySelector('a')
      if (current) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
  }

  pages.forEach((page) => {
    page.addEventListener('beforematch', () => showPage(page))
  })
})()
```
- **Load order** in `page.njk`'s `pageScripts`: the TipTap bundle (only when `isMarkdown`), then `guide-pages.js`, then `guide-position.js`.
- **Positions of hidden headings:** `hidden="until-found"` applies `content-visibility: hidden`, so headings on hidden pages report meaningless positions. `guide-position.js` must filter them with `heading.closest('[hidden]')` (Plan 4).

## Caveats
- **Page weight:** the stepper's HTML is now the whole guide. Measure with a real 200-page conversion. If it's too heavy, lazily fetch hidden pages' HTML, at the cost of find only covering pages already loaded, or add Plan 6's search box.
- **Saved position after a find jump:** the resume point (Plan 4) becomes the heading nearest the top of the screen after the jump. That can be the section heading rather than the subheading the match is under.
- **Styling:** revealed pages use the server-rendered HTML, so anything TipTap renders differently needs mirroring in `markdown-fallback.js`. The `.app-guide-markdown` SCSS covers both.

## Verification
Playwright can't open the browser's find bar, but a **text-fragment navigation** (`#:~:text=…`) into a hidden `until-found` page goes through the same reveal and `beforematch`. Use it to stand in for Ctrl+F:
1. **Initial state:** on `?format=stepper&page=1`, page 2 is `hidden="until-found"`, has server-rendered HTML with the red `[SBI]` span, and has **no** `.ProseMirror`. Page 1 has live editors.
2. **Reveal:** navigate to `?format=stepper&page=1#:~:text=suitably%20qualified%20adviser`. Check that:
   - page 2 is shown and page 1 is `until-found` again;
   - the URL has `?page=2`;
   - the contents list has page 2's sections as `aria-current`;
   - the match is on screen and highlighted.
3. **Viewer data:** stepper page 2 contains 5 JSON scripts (its own parts only). Traditional still mounts every part.
4. **By hand:** press Ctrl+F in Edge or Chrome with a word from another page, then again in Firefox and Safari to confirm the fallback behaviour.
5. **Other guides:** a JS-content guide in the stepper renders 4 pages, 3 of them hidden, with no JSON scripts.
