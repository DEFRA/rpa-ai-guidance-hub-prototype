//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//
// The editor borrows its formatting toolbar from the one GOV.UK publishing uses
// (alphagov/content-publisher, app/views/components/_markdown_editor.html.erb).
// It differs in showing the markdown and preview side by side rather than
// toggling between them, because these documents run to 100 pages and the
// designer works to a list of issues at specific locations.
//

// Where the editor leaves the current markdown for a preview opened in a new
// tab. Local storage rather than session storage, because session storage is
// only copied into a new tab in some browsers.
const PREVIEW_KEY = 'rpa-guidance-hub.preview'

// ---------------------------------------------------------------------------
// Markdown preview
// ---------------------------------------------------------------------------

// A deliberately small markdown renderer — enough to show headings, lists,
// links and images so a designer can judge the shape of the guidance. It is not
// a full markdown implementation and does not need to be: the prototype only
// has to look right, not to publish anything. GOV.UK renders its preview on the
// server, which is what a real build would do.
function renderMarkdown (markdown) {
  function escapeHtml (text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Markdown carries the link target through untouched, and escaping the text
  // does nothing about the scheme — href="javascript:…" survives it. These
  // documents are converted from Word files the hub did not write, so a link
  // target is untrusted input. Anything that is not plainly safe loses its href
  // rather than becoming a live script link.
  //
  // Entity-encoded attempts (&#106;avascript:) are already dead, because the
  // ampersand is escaped before this runs.
  function safeUrl (url) {
    const bare = url.trim().replace(/[\u0000-\u001f\s]/g, '')
    if (/^(https?:|mailto:|#|\/|\.)/i.test(bare)) return url
    // No scheme at all means a relative link, which is fine.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(bare)) return url
    return ''
  }

  // Images are matched before links, because an image is a link with a leading
  // exclamation mark.
  //
  // The preview shows how the guidance will read once published, so it never
  // marks anything up as a problem. Quality issues belong in the issue list.
  function inline (text) {
    return escapeHtml(text)
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, function (match, alt) {
        return '<span class="app-markdown-preview__image">' +
          (alt.trim() ? 'Image: ' + alt : 'Image') +
          '</span>'
      })
      .replace(/\[([^\]]+)\]\(([^)]*)\)/g, function (match, label, url) {
        const href = safeUrl(url)
        return href
          ? '<a class="govuk-link" href="' + href + '">' + label + '</a>'
          : '<span class="app-markdown-preview__blocked" title="Link removed: unsafe address">' + label + '</span>'
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  }

  const html = []
  let listItems = []

  function flushList () {
    if (!listItems.length) return
    html.push('<ul class="govuk-list govuk-list--bullet">' + listItems.join('') + '</ul>')
    listItems = []
  }

  markdown.split('\n').forEach(function (line) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushList()
      // Shifted down one level so the preview sits under the page heading
      // rather than competing with it.
      const level = Math.min(heading[1].length + 1, 6)
      const size = level === 2 ? 'govuk-heading-m' : 'govuk-heading-s'
      html.push('<h' + level + ' class="' + size + '">' + inline(heading[2]) + '</h' + level + '>')
      return
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      listItems.push('<li>' + inline(bullet[1]) + '</li>')
      return
    }

    flushList()
    html.push('<p class="govuk-body">' + inline(trimmed) + '</p>')
  })

  flushList()
  return html.join('')
}

// This file loads as a module (see app/views/layouts/main.html), which keeps
// its own top-level declarations out of global scope — so a plain inline
// <script> on a page, such as guidance-document-edit.html's Preview tab,
// cannot call renderMarkdown() directly even once this file has run. Exported
// the same way quality-checks.js exposes itself, as window.appQualityChecks,
// read a few lines below.
window.appRenderMarkdown = renderMarkdown

// ---------------------------------------------------------------------------
// Quality checks
// ---------------------------------------------------------------------------

// Provided by quality-checks.js, which app/routes.js also requires on the
// server. The rules come from the authoring requirements and are written once,
// so the list a page renders and the list the editor updates as you type are
// produced by exactly the same code.
const qualityChecks = window.appQualityChecks

function headingsIn (markdown) {
  const headings = []

  markdown.split('\n').forEach(function (line, index) {
    const match = line.trim().match(/^(#{1,6})\s+(.*)$/)
    if (match) {
      headings.push({ level: match[1].length, text: match[2], line: index + 1 })
    }
  })

  return headings
}

// ---------------------------------------------------------------------------
// Upload progress
// ---------------------------------------------------------------------------

// Stands in for polling CDP Uploader's status endpoint while a file is uploaded
// and scanned. A real service would poll GET /status/{uploadId} until it
// reported success or a rejection; here the stages just run on a timer so the
// wait can be put in front of a research participant.
//
// The page it moves on to is a plain link as well, so the journey still works
// with JavaScript off.
window.GOVUKPrototypeKit.documentReady(() => {
  const progress = document.querySelector('[data-module="app-progress"]')
  if (!progress) return

  const status = progress.querySelector('[data-progress-status]')
  const bar = progress.querySelector('[data-progress-bar]')
  const next = progress.dataset.next
  const count = Number(progress.dataset.count || 1)

  const stages = [
    { text: count > 1 ? 'Uploading ' + count + ' files' : 'Uploading your file', percent: 30 },
    { text: 'Scanning for viruses', percent: 70 },
    { text: 'Upload complete', percent: 100 }
  ]

  let index = 0

  function advance () {
    const stage = stages[index]
    status.textContent = stage.text
    bar.style.width = stage.percent + '%'
    index++

    if (index < stages.length) {
      window.setTimeout(advance, 1200)
    } else if (next) {
      window.setTimeout(function () { window.location.href = next }, 800)
    }
  }

  advance()
})

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

window.GOVUKPrototypeKit.documentReady(() => {
  const module = document.querySelector('[data-module="app-editor"]')
  if (!module) return

  const editor = module.querySelector('[data-editor-input]')
  const preview = module.querySelector('[data-editor-preview]')
  // The outline sits above the editor rather than inside it, so it is looked up
  // from the document like the summary and worklist.
  const outline = document.querySelector('[data-editor-outline]')
  const imagePanel = module.querySelector('[data-editor-image-panel]')
  const summary = document.querySelector('[data-editor-summary]')
  const worklist = document.querySelector('[data-editor-worklist]')


  function escapeHtml (text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // -- Writing into the textarea -------------------------------------------

  // Uses execCommand where it is available so the browser's own undo stack
  // still works — retyping everything after an accidental toolbar press would
  // be miserable in a 100-page document.
  function replaceSelection (text) {
    editor.focus()
    let inserted = false

    try {
      inserted = document.execCommand('insertText', false, text)
    } catch (error) {
      inserted = false
    }

    if (!inserted) {
      const start = editor.selectionStart
      editor.setRangeText(text, start, editor.selectionEnd, 'end')
    }
  }

  // Grows the selection out to whole lines, so prefixing a heading or a bullet
  // works wherever the caret happens to be sitting.
  function selectWholeLines () {
    const value = editor.value
    let start = editor.selectionStart
    let end = editor.selectionEnd

    while (start > 0 && value[start - 1] !== '\n') start--
    while (end < value.length && value[end] !== '\n') end++

    editor.setSelectionRange(start, end)
    return value.slice(start, end)
  }

  function prefixLines (build) {
    const selected = selectWholeLines()
    const lines = selected.split('\n')

    replaceSelection(lines.map(function (line, index) {
      // Drop any prefix already there, so pressing the button twice swaps the
      // style instead of stacking it up.
      const bare = line.replace(/^(\s*)(#{1,6}\s+|[-*]\s+|\d+\.\s+)/, '$1')
      return build(bare, index)
    }).join('\n'))
  }

  const actions = {
    h2: function () { prefixLines(function (line) { return line.trim() ? '## ' + line : line }) },
    h3: function () { prefixLines(function (line) { return line.trim() ? '### ' + line : line }) },
    bullets: function () { prefixLines(function (line) { return line.trim() ? '- ' + line : line }) },
    numbers: function () {
      let n = 0
      prefixLines(function (line) {
        if (!line.trim()) return line
        n++
        return n + '. ' + line
      })
    },
    link: function () {
      const start = editor.selectionStart
      const selected = editor.value.slice(start, editor.selectionEnd)
      replaceSelection('[' + (selected || 'link text') + '](https://www.gov.uk)')
    },
    image: function () {
      imagePanel.hidden = !imagePanel.hidden
      if (!imagePanel.hidden) imagePanel.querySelector('input').focus()
    }
  }

  // -- Rendering ------------------------------------------------------------

  function renderSummary (issues) {
    if (!summary) return

    if (!issues.length) {
      summary.innerHTML =
        '<p class="govuk-body app-issue-bar__none">No issues found. Everything the quality checks look for has been fixed.</p>'
      return
    }

    summary.innerHTML =
      '<p class="app-issue-bar__total">' + issues.length +
        (issues.length === 1 ? ' issue to fix' : ' issues to fix') + '</p>' +
      '<ul class="app-issue-bar__groups">' +
      qualityChecks.severityCounts(issues).map(function (entry) {
        return '<li class="app-issue-bar__group">' +
          '<span class="govuk-tag ' + entry.tag.classes + '">' +
            entry.count + ' ' + escapeHtml(entry.tag.text.toLowerCase()) +
          '</span>' +
          '</li>'
      }).join('') +
      '</ul>'
  }

  function renderWorklist (issues) {
    if (!worklist) return

    if (!issues.length) {
      worklist.innerHTML = '<p class="govuk-body">Nothing left to fix.</p>'
      return
    }

    worklist.innerHTML =
      '<ul class="app-worklist">' +
      issues.map(function (issue) {
        return '<li class="app-worklist__item">' +
          '<span class="govuk-tag ' + issue.severityTag.classes + ' app-worklist__severity">' +
            escapeHtml(issue.severityTag.text) +
          '</span>' +
          '<span class="app-worklist__title">' +
            escapeHtml(issue.title) +
            '<span class="app-worklist__rule">' + escapeHtml(issue.ruleId) + '</span>' +
          '</span>' +
          '<button type="button" class="app-worklist__go govuk-link" data-line="' + issue.line + '">' +
            'Go to line ' + issue.line +
          '</button>' +
        '</li>'
      }).join('') +
      '</ul>'
  }

  function renderOutline (headings) {
    if (!outline) return

    outline.innerHTML =
      '<option value="">Jump to a section…</option>' +
      headings.map(function (heading) {
        const indent = heading.level > 1 ? '— '.repeat(heading.level - 1) : ''
        return '<option value="' + heading.line + '">' + escapeHtml(indent + heading.text) + '</option>'
      }).join('')
  }

  function update () {
    const markdown = editor.value
    const issues = qualityChecks.findIssues(markdown)

    renderSummary(issues)
    renderWorklist(issues)
    renderOutline(headingsIn(markdown))

    preview.innerHTML = renderMarkdown(markdown)
  }

  // A 100-page document is around 220KB of markdown, so re-rendering on every
  // keystroke costs about 30ms. Waiting for a pause in typing keeps the
  // textarea responsive whatever the document size.
  let pending
  function scheduleUpdate () {
    window.clearTimeout(pending)
    pending = window.setTimeout(update, 150)
  }

  // Puts the caret on a line and scrolls it into view. This is what makes a
  // 100-page document workable: an issue is a place you can go to.
  function goToLine (lineNumber) {
    const lines = editor.value.split('\n')
    let start = 0
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      start += lines[i].length + 1
    }

    const lineHeight = parseFloat(window.getComputedStyle(editor).lineHeight) || 20

    editor.focus()
    editor.setSelectionRange(start, start + (lines[lineNumber - 1] || '').length)
    editor.scrollTop = Math.max(0, (lineNumber - 4) * lineHeight)

    // Bring the preview to the same place, which is the whole point of having
    // it beside the markdown.
    syncScroll(editor, preview)
  }

  // -- Keeping the two panes together ---------------------------------------

  // Scrolls the panes in proportion so the preview shows roughly the section
  // being edited. Mapping line numbers to rendered blocks would be more exact,
  // but proportional scrolling is what markdown editors generally do and it
  // holds up well enough over a long document.
  //
  // The flag stops the two panes pushing each other back and forth: scrolling
  // one moves the other, which would otherwise fire its scroll handler in turn.
  //
  // Released on a timer rather than requestAnimationFrame, which does not run
  // while the tab is in the background — the flag would stay set and the panes
  // would quietly stop following each other for the rest of the session.
  let syncing = false
  let syncTimer

  function syncScroll (from, to) {
    if (syncing) return
    syncing = true

    const fromMax = from.scrollHeight - from.clientHeight
    const toMax = to.scrollHeight - to.clientHeight
    to.scrollTop = fromMax > 0 ? (from.scrollTop / fromMax) * toMax : 0

    window.clearTimeout(syncTimer)
    syncTimer = window.setTimeout(function () { syncing = false }, 100)
  }

  // -- Wiring ---------------------------------------------------------------

  editor.addEventListener('input', scheduleUpdate)

  module.addEventListener('click', function (event) {
    const toolbarButton = event.target.closest('[data-md]')
    if (toolbarButton) {
      event.preventDefault()
      const action = actions[toolbarButton.dataset.md]
      if (action) {
        action()
        scheduleUpdate()
      }
      return
    }
  })

  if (imagePanel) {
    imagePanel.querySelector('[data-editor-image-insert]').addEventListener('click', () => {
      const file = imagePanel.querySelector('[data-editor-image-file]').value.trim()
      const description = imagePanel.querySelector('[data-editor-image-alt]').value.trim()

      // Alt text is asked for at the point the image goes in, which is how
      // GOV.UK's editor does it — it stops the commonest quality issue at
      // source rather than reporting it afterwards.
      replaceSelection('![' + description + '](' + (file || 'image.png') + ')')

      imagePanel.querySelector('[data-editor-image-file]').value = ''
      imagePanel.querySelector('[data-editor-image-alt]').value = ''
      imagePanel.hidden = true
      scheduleUpdate()
    })
  }

  if (worklist) {
    worklist.addEventListener('click', function (event) {
      const button = event.target.closest('.app-worklist__go')
      if (button) goToLine(Number(button.dataset.line))
    })
  }

  if (outline) {
    outline.addEventListener('change', () => {
      if (outline.value) goToLine(Number(outline.value))
      outline.value = ''
    })
  }

  // A finding links here with ?line=N, so "go to a specific issue" lands on it.
  const requestedLine = Number(new URLSearchParams(window.location.search).get('line'))
  if (requestedLine > 0) {
    window.setTimeout(function () { goToLine(requestedLine) }, 0)
  }

  editor.addEventListener('scroll', function () { syncScroll(editor, preview) })
  preview.addEventListener('scroll', function () { syncScroll(preview, editor) })

  // Hand the current markdown to the new tab so the preview there shows unsaved
  // changes rather than the last saved draft.
  const previewLink = module.querySelector('[data-editor-preview-link]')
  if (previewLink) {
    previewLink.addEventListener('click', function () {
      try {
        window.localStorage.setItem(PREVIEW_KEY, editor.value)
      } catch (error) {
        // Private browsing can refuse local storage. The new tab falls back to
        // the saved draft, which is still worth opening.
      }
    })
  }

  update()
})

// ---------------------------------------------------------------------------
// Section navigation on the simpler markdown editor
// ---------------------------------------------------------------------------

// Same idea as goToLine() above, but standalone: this page has no preview
// pane to keep in sync and no outline built from the markdown as it changes,
// so it does not need the full editor module around it.
window.GOVUKPrototypeKit.documentReady(() => {
  const nav = document.querySelector('[data-module="app-section-nav"]')
  if (!nav) return

  const target = document.querySelector(nav.dataset.target)
  if (!target) return

  nav.querySelectorAll('[data-line]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()

      const lineNumber = Number(link.dataset.line)
      const lines = target.value.split('\n')
      let start = 0
      for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
        start += lines[i].length + 1
      }

      const lineHeight = parseFloat(window.getComputedStyle(target).lineHeight) || 20

      target.focus()
      target.setSelectionRange(start, start + (lines[lineNumber - 1] || '').length)
      target.scrollTop = Math.max(0, (lineNumber - 2) * lineHeight)
    })
  })
})

// ---------------------------------------------------------------------------
// Preview in its own tab
// ---------------------------------------------------------------------------

// Renders the document on a page of its own. Uses whatever the editor last put
// in local storage so unsaved edits are included, and falls back to the saved
// draft embedded in the page when this is opened directly.
window.GOVUKPrototypeKit.documentReady(() => {
  const target = document.querySelector('[data-module="app-standalone-preview"]')
  if (!target) return

  const fallback = document.querySelector('[data-preview-source]')
  let markdown = ''

  try {
    markdown = window.localStorage.getItem(PREVIEW_KEY) || ''
  } catch (error) {
    markdown = ''
  }

  if (!markdown && fallback) markdown = fallback.value

  target.innerHTML = renderMarkdown(markdown)
})

// ---------------------------------------------------------------------------
// v3 search filters
// ---------------------------------------------------------------------------

// The filter behaviour copied from DEFRA/rpa-guidance-prototype (the guide
// library module in src/client/javascripts/application.js): changing a facet
// applies it immediately, which makes the explicit Apply button redundant,
// and the filter column can be collapsed to give the results the full width.
// Without JavaScript the Apply button stays and the toggle does nothing.
window.GOVUKPrototypeKit.documentReady(() => {
  const searchForm = document.querySelector('[data-module="app-v3-search"]')
  if (!searchForm) return

  const applyButton = searchForm.querySelector(
    '[data-module="app-apply-filters"]'
  )
  const filterToggle = searchForm.querySelector(
    '[data-module="app-filter-toggle"]'
  )

  if (applyButton) {
    // Filters auto-apply on change with JS on, so the button is redundant.
    // Remove it rather than set .hidden, which govuk-button's display overrides.
    applyButton.remove()
  }

  searchForm
    .querySelectorAll('input[type="checkbox"], input[type="radio"]')
    .forEach((box) => {
      box.addEventListener('change', () => searchForm.submit())
    })

  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      const hidden = searchForm.classList.toggle(
        'app-v3-search-form--filters-hidden'
      )
      filterToggle.setAttribute('aria-expanded', String(!hidden))
      filterToggle.textContent = hidden ? 'Show filters' : 'Hide filters'
    })
  }
})

// ---------------------------------------------------------------------------
// TipTap guide editor (v3's update-existing-guide flow)
// ---------------------------------------------------------------------------

// Progressive enhancement over the markdown textarea on guide-edit.html.
// TipTap is loaded from esm.sh at runtime rather than bundled — the
// prototype kit has no JS build step — so with no network (or no JS) the
// import never resolves and the textarea simply stays, which is the basic
// accessible version working as designed. When TipTap does load, the
// tiptap-markdown extension keeps the textarea's markdown in sync on every
// edit, so the form posts exactly what the basic version would.
window.GOVUKPrototypeKit.documentReady(() => {
  const mount = document.querySelector('[data-module="app-tiptap-editor"]')
  if (!mount) return

  const fallback = mount.querySelector('[data-tiptap-fallback]')
  const textarea = fallback && fallback.querySelector('textarea')
  const toolbar = mount.querySelector('[data-tiptap-toolbar]')
  const surface = mount.querySelector('[data-tiptap-surface]')
  if (!textarea || !toolbar || !surface) return

  // ?deps pins tiptap-markdown to the same @tiptap/core instance as the
  // other imports, or its schema checks fail against a duplicate copy.
  Promise.all([
    import('https://esm.sh/@tiptap/core@2?deps=@tiptap/pm@2'),
    import('https://esm.sh/@tiptap/starter-kit@2?deps=@tiptap/core@2,@tiptap/pm@2'),
    import('https://esm.sh/tiptap-markdown@0.8.10?deps=@tiptap/core@2,@tiptap/pm@2')
  ])
    .then(([core, starterKit, markdown]) => {
      const editor = new core.Editor({
        element: surface,
        extensions: [starterKit.default, markdown.Markdown],
        content: textarea.value,
        editorProps: {
          attributes: {
            role: 'textbox',
            'aria-multiline': 'true',
            'aria-label': 'Guide content'
          }
        },
        onUpdate: () => {
          textarea.value = editor.storage.markdown.getMarkdown()
        }
      })

      const commands = {
        bold: (chain) => chain.toggleBold(),
        italic: (chain) => chain.toggleItalic(),
        heading2: (chain) => chain.toggleHeading({ level: 2 }),
        heading3: (chain) => chain.toggleHeading({ level: 3 }),
        bulletList: (chain) => chain.toggleBulletList(),
        orderedList: (chain) => chain.toggleOrderedList(),
        undo: (chain) => chain.undo(),
        redo: (chain) => chain.redo()
      }

      const isActive = {
        bold: () => editor.isActive('bold'),
        italic: () => editor.isActive('italic'),
        heading2: () => editor.isActive('heading', { level: 2 }),
        heading3: () => editor.isActive('heading', { level: 3 }),
        bulletList: () => editor.isActive('bulletList'),
        orderedList: () => editor.isActive('orderedList')
      }

      toolbar.querySelectorAll('[data-tiptap-command]').forEach((button) => {
        button.addEventListener('click', () => {
          const command = commands[button.dataset.tiptapCommand]
          if (command) command(editor.chain().focus()).run()
        })
      })

      // aria-pressed follows the selection, so the toolbar reads back which
      // formatting applies at the caret.
      editor.on('transaction', () => {
        toolbar.querySelectorAll('[aria-pressed]').forEach((button) => {
          const check = isActive[button.dataset.tiptapCommand]
          if (check) button.setAttribute('aria-pressed', String(check()))
        })
      })

      toolbar.hidden = false
      surface.hidden = false
      fallback.hidden = true
    })
    .catch(() => {
      // Offline, or the CDN is unreachable — the markdown textarea stays.
    })
})

// ---------------------------------------------------------------------------
// Quality check anchors (v3 guide editor)
// ---------------------------------------------------------------------------

// Each finding in the pane beside the editor is one button; clicking it
// scrolls the editor straight to the passage the finding is about (located
// by the finding's quoted text, falling back to the markdown line's text)
// and flashes it — or, if the markdown textarea is still the editor,
// selects that line instead.
window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('[data-finding-anchor]')) return

  // The three panels beside the editor — version history, comments and
  // quality checks — toggled by the link-styled buttons in the sticky bar.
  // At most one is open at a time: opening one closes the others, and each
  // link's text flips between Show and Hide. With every panel closed the
  // side pane disappears and the editor takes the full width. The links
  // ship hidden; without JavaScript all three panels simply render stacked.
  const side = document.querySelector('[data-module="app-editor-panes"]')
  const paneLinks = document.querySelector('[data-pane-links]')

  if (side && paneLinks) {
    const panes = side.querySelectorAll('[data-editor-pane]')
    const toggles = paneLinks.querySelectorAll('[data-pane-toggle]')
    const labels = {
      versions: 'version history',
      comments: 'comments',
      checks: 'quality checks'
    }
    let active = 'checks'

    function renderPanes () {
      panes.forEach((pane) => {
        pane.hidden = pane.dataset.editorPane !== active
      })
      side.hidden = !active
      toggles.forEach((toggle) => {
        const name = toggle.dataset.paneToggle
        toggle.textContent = (name === active ? 'Hide ' : 'Show ') + labels[name]
        toggle.setAttribute('aria-expanded', String(name === active))
      })
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        active = toggle.dataset.paneToggle === active ? null : toggle.dataset.paneToggle
        renderPanes()
      })
    })

    paneLinks.hidden = false
    renderPanes()
  }

  const textarea = document.querySelector('[data-tiptap-fallback] textarea')

  // The text a finding should land on: its quote if the rule recorded one,
  // otherwise the markdown line itself, stripped of list/heading syntax.
  function findingSnippet (button) {
    const quote = (button.dataset.findingQuote || '').trim()
    if (quote) return quote

    const line = Number(button.dataset.findingLine)
    const raw = (textarea ? textarea.value.split('\n')[line - 1] : '') || ''
    return raw.replace(/^[#>\-*\d.\s]+/, '').trim().slice(0, 60)
  }

  // The highlight is an overlay positioned over the passage rather than a
  // class on the passage itself: ProseMirror owns its DOM and its mutation
  // observer reverts foreign attribute changes almost immediately, so a
  // class added to one of its nodes never survives long enough to be seen.
  function flash (element) {
    const rect = element.getBoundingClientRect()
    const overlay = document.createElement('div')
    overlay.className = 'app-quality-flash-overlay'
    overlay.style.top = rect.top + window.scrollY - 4 + 'px'
    overlay.style.left = rect.left + window.scrollX - 8 + 'px'
    overlay.style.width = rect.width + 16 + 'px'
    overlay.style.height = rect.height + 8 + 'px'
    document.body.appendChild(overlay)
    overlay.addEventListener('animationend', () => overlay.remove())
  }

  function anchorInSurface (surface, button) {
    const snippet = findingSnippet(button)
    if (!snippet) return false

    const blocks = surface.querySelectorAll('p, h1, h2, h3, li')
    for (const block of blocks) {
      if (block.textContent.includes(snippet)) {
        // Instant, not smooth: ProseMirror's own focus and scroll handling
        // cancels an in-flight smooth scroll, leaving the page where it was.
        block.scrollIntoView({ block: 'center' })
        flash(block)
        return true
      }
    }
    return false
  }

  function anchorInTextarea (button) {
    const line = Number(button.dataset.findingLine)
    const lines = textarea.value.split('\n')
    const start = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0)

    textarea.focus()
    textarea.setSelectionRange(start, start + (lines[line - 1] || '').length)
    // Rough but serviceable: put the target line about a third of the way
    // down the visible box.
    const lineHeight = textarea.scrollHeight / lines.length
    textarea.scrollTop = Math.max(0, (line - 1) * lineHeight - textarea.clientHeight / 3)
  }

  // Delegated from the document, so the anchors work regardless of when the
  // findings list was shown, hidden or re-rendered.
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-finding-anchor]')
    if (!button) return

    const surface = document.querySelector('[data-tiptap-surface] .ProseMirror')
    const surfaceVisible = surface && !surface.closest('[hidden]')

    if (surfaceVisible && anchorInSurface(surface, button)) return
    if (textarea) anchorInTextarea(button)
  })
})
