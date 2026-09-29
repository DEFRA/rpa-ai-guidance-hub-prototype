import { Editor } from '@tiptap/core'

import { EXTENSIONS } from './extensions.js'

// One read-only Editor per [data-tiptap-markdown] mount point. The Markdown
// arrives JSON-encoded in a child <script>, never as HTML, since it's
// converted Word content. `data-tiptap-editable="true"` is left as a hook
// for a future editing flow.
function mount(element) {
  const source = element.querySelector('script[type="application/json"]')
  if (!source) return null

  const markdown = JSON.parse(source.textContent)
  const target = document.createElement('div')
  // Replaces the server-rendered no-JS fallback.
  element.replaceChildren(target)

  return new Editor({
    element: target,
    extensions: EXTENSIONS,
    content: markdown,
    contentType: 'markdown',
    editable: element.dataset.tiptapEditable === 'true'
  })
}

document.querySelectorAll('[data-tiptap-markdown]').forEach(mount)
