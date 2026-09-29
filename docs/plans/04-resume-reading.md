# Plan 4: Resume reading (last position, URL hash, Continue, Recently opened)

**Depends on:** Plan 2 (`findAnchor`), Plan 3 (`guide/section/` route, `sectionHref`). Every heading must carry `data-guide-anchor="<id>"` (Plan 3's `renderPart`).

## Context

Research: people **lose their place** in long guides. The user asked for an "auto bookmarker as users scroll". The design keeps that separate from case bookmarks: **one last-read position per guide**, not a growing list of automatic bookmarks, which would bury the real ones.

The user chose all three ways of surfacing it:
1. **URL hash follows scroll.** The `#anchor` updates to the heading being read, so refresh, Back and copy-link keep your place.
2. **Continue banner.** Reopening a guide offers "You were last reading **2.3 …** Continue reading". It's offered rather than jumped to automatically, so opening a guide stays predictable.
3. **Recently opened deep links.** In the hub's Recently opened list, each guide links straight to its saved position, with a "Continue from …" line.

## To do

- [ ] 1. Write `app/data/guide-positions.js` (`getGuidePosition`, `setGuidePosition`), stored in the session as `guidePositions[id]` and saving only validated anchors.
- [ ] 2. Create `guide/position/routes.js`: `POST /:id/position` validates via `locateAnchor`, saves, and returns 204.
- [ ] 3. Write `app/assets/javascripts/guide-position.js`:
  - it activates after the first scroll only, with a 400 ms settle;
  - the trigger line is `min(120px, 20%)`, with the last-heading-at-end rule;
  - it skips headings inside `[hidden]`;
  - it updates the hash with `replaceState`, saves with `fetch`, and uses `sendBeacon` on `pagehide`;
  - it hides `[data-guide-resume]` when the URL has a hash.
- [ ] 4. Confirm every heading has `data-guide-anchor` (Plan 3's `renderPart`).
- [ ] 5. In `guide/view-model.js`, add `buildResume(req, id, pages)` (null for the guide's first heading) and return `resume` (genuine entry only) and `positionHref`.
- [ ] 6. In `guide/page.njk`:
  - add `data-guide-position-href` on `.app-guide-reading`;
  - add the "You were last reading … Continue reading" inset with `data-guide-resume`;
  - load `guide-position.js` in `pageScripts`.
- [ ] 7. In `hub/view-model.js`, for the `recently-opened` list only, set `overviewHref` to `sectionHref(...)` and add `resumeLabel` when a position exists.
- [ ] 8. In `hub/page.njk`, add the "Continue from …" line.
- [ ] 9. Run every step in Verification below. Wait for the dev server's auto-reload to settle before measuring scrolls.
- [ ] 10. Add a dated entry to `guide/page.notes.md`, then run `npm run format`.

## Resulting structure

```
app/data/guide-positions.js                    new — get/setGuidePosition (session guidePositions[id])
app/assets/javascripts/guide-position.js       new — scroll tracker: #hash, POST, hide resume inset
app/views/playground/guide/
  position/routes.js                            new — POST /playground/guide/:id/position → 204
  view-model.js                                 edit — buildResume(); resume + positionHref in the model
  page.njk                                      edit — data-guide-position-href, resume inset, load script
app/views/playground/hub/view-model.js          edit — Recently opened rows deep-link via section/
app/views/playground/hub/page.njk               edit — "Continue from …" line
```

## Files in detail

### `app/data/guide-positions.js`
```js
// Where a reader last was in each guide — one position per guide, not a
// list, so it never clutters the case bookmarks.
function positions(req) {
  req.session.data.guidePositions = req.session.data.guidePositions || {}
  return req.session.data.guidePositions
}

function getGuidePosition(req, id) {
  return positions(req)[id] || null
}

// `found` is guide-content.js's findAnchor result — only an anchor that
// really exists in the guide is saved.
function setGuidePosition(req, id, found) {
  if (!found) return
  positions(req)[id] = { anchor: found.anchor, label: found.label }
}

module.exports = { getGuidePosition, setGuidePosition }
```

### `guide/position/routes.js`
Same pattern as the existing `panel-width/routes.js`.
```js
const router = govukPrototypeKit.requests.setupRouter('/playground/guide')

router.post('/:id/position', (req, res) => {
  setGuidePosition(req, req.params.id, locateAnchor(req.params.id, String(req.body.anchor || '')))
  res.sendStatus(204)
})
```
The kit parses URL-encoded bodies. The client sends `URLSearchParams` through both `fetch` and `sendBeacon`, which both arrive as `application/x-www-form-urlencoded`.

### `app/assets/javascripts/guide-position.js` (plain script, no bundling)
```js
;(function () {
  const root = document.querySelector('[data-guide-position-href]')
  if (!root) return

  const href = root.getAttribute('data-guide-position-href')
  const headings = Array.from(document.querySelectorAll('[data-guide-anchor]'))
  if (!headings.length) return

  // Arriving at a specific place already (a bookmark, a deep link, a
  // refresh) makes the resume inset redundant.
  const resume = document.querySelector('[data-guide-resume]')
  if (resume && window.location.hash) resume.hidden = true

  let current = window.location.hash.slice(1) || null
  let saved = current
  let timer = null

  // The last heading that has scrolled near the top of the window (within
  // 120px, or a fifth of a short window). At the very end of the guide the
  // last headings can never scroll that high, so there the last heading on
  // screen counts instead.
  function headingInView() {
    const scroller = document.scrollingElement || document.documentElement
    const atEnd = window.innerHeight + window.scrollY >= scroller.scrollHeight - 2
    const line = atEnd ? window.innerHeight : Math.min(120, window.innerHeight * 0.2)
    // Only headings on screen count — not those on hidden stepper pages (Plan 6).
    const shown = headings.filter((heading) => !heading.closest('[hidden]'))
    if (!shown.length) return current
    let found = shown[0]
    for (const heading of shown) {
      if (heading.getBoundingClientRect().top > line) break
      found = heading
    }
    return found.getAttribute('data-guide-anchor')
  }

  function save(anchor, useBeacon) {
    if (!anchor || anchor === saved) return
    saved = anchor
    const body = new URLSearchParams({ anchor })
    if (useBeacon && navigator.sendBeacon) navigator.sendBeacon(href, body)
    else window.fetch(href, { method: 'POST', body }).catch(() => {})
  }

  function settle() {
    current = headingInView()
    const url = new URL(window.location.href)
    url.hash = current
    window.history.replaceState(window.history.state, '', url)
    save(current)
  }

  // Only after the reader scrolls — never on load, or an unanswered
  // "Continue reading" inset would be overwritten by the top of the guide.
  // Capture, so a scroll inside the side-nav shell's own column counts too.
  document.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 400)
    },
    { capture: true, passive: true }
  )

  window.addEventListener('pagehide', () => save(current, true))
})()
```
Tuning found while testing:
- **Trigger line:** a threshold of 25% of the viewport picked the *next* heading when a part was short, so scrolling to part 4 recorded part 5. `min(120px, 20%)` fixed it.
- **End of the page:** without the `atEnd` rule, the last one or two headings could never be recorded.
- **`replaceState`, not `pushState`:** scrolling mustn't create Back history.

### Guide view model
```js
function buildResume(req, id, pages, base = '/playground') {
  const position = getGuidePosition(req, id)
  const found = position && findAnchor(pages, position.anchor)
  const first = pages[0].sections[0]
  // Not when the saved place is just the top of the guide.
  if (!found || found.anchor === first.id || found.anchor === first.parts[0].id) return null
  return { label: found.label, href: sectionHref(base, id, found.anchor) }
}

// inside guideViewModel:
const isGenuineEntry = !req.query.page && !req.query.step
// return:
resume: isGenuineEntry ? buildResume(req, id, pages) : null,
positionHref: `/playground/guide/${encodeURIComponent(id)}/position`,
```

### `guide/page.njk`
```njk
<div class="app-guide-reading app-guide-reading--{{ readingWidth }}" data-guide-position-href="{{ positionHref }}">
  …title, tools…
  {% if resume %}
    <div class="govuk-inset-text app-guide-resume" data-guide-resume>
      You were last reading <strong>{{ resume.label }}</strong>.
      <a class="govuk-link" href="{{ resume.href }}">Continue reading<span class="govuk-visually-hidden"> from {{ resume.label }}</span></a>
    </div>
  {% endif %}
  …
</div>

{% block pageScripts %}
  …
  <script src="/public/javascripts/guide-position.js"></script>
{% endblock %}
```

### Hub (`hub/view-model.js` and `page.njk`)
```js
const { getGuidePosition } = require('../../../data/guide-positions')
// in the results map (only in the Recently opened list):
const position = list === 'recently-opened' ? getGuidePosition(req, document.id) : null
return {
  ...document,
  overviewHref: position
    ? sectionHref('/playground', document.id, position.anchor)
    : `/playground/guide/${document.id}`,
  resumeLabel: position ? position.label : null,
  pinned: isPinned(req, document.id)
}
```
```njk
{% if result.resumeLabel %}
  <p class="govuk-body-s app-search-results__resume">Continue from <strong>{{ result.resumeLabel }}</strong></p>
{% endif %}
```
The hub appends `?from=search&q=…` to `overviewHref`. The section route ignores the query and redirects with the `#anchor`.

## Caveats found in testing
- **Recently opened coverage:** the list only tracks guides in `guidance-documents.js` (existing behaviour), so the sample Markdown guide never appears. Test the deep link with a JS-content guide.
- **Non-heading hashes:** the tracker replaces hashes that aren't headings, such as `#guide-case-bookmarks` after a panel form redirect, once the reader scrolls.
- **Dev server reloads:** the Prototype Kit's `dev` server auto-reloads the browser on file changes, which interrupts scroll tests. Wait for it to settle before measuring.

## Verification
1. **On load:** in traditional, nothing is saved and there's no hash.
2. **After scrolling:** scroll to a heading. After about 400ms the hash is `#part-N` and a POST returns 204. Scrolling to the very bottom records the last heading.
3. **Continue banner:** open the guide fresh (no `?page`/`?step`). The inset says "You were last reading …", and Continue lands on that heading, in the right stepper page if you're in the stepper.
4. **With a hash:** open it with a `#anchor` and the inset is hidden.
5. **Recently opened:** `/playground/hub?list=recently-opened` links a scrolled guide to `/playground/guide/<id>/section/<anchor>` and shows "Continue from …".
