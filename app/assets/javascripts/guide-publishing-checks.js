// Start publishing checks in the side nav on a guide page (designers;
// guide/page.njk's sideNavPageItems). It runs the checks — a pretend run,
// as partials/checks-widget-script.njk's — and shows where they are on the
// button and in the line under it (data-checks-nav-status). While they run,
// the button reads Running publishing checks and ignores clicks; once run,
// it reads Show publishing checks, with the number of issues as a badge,
// and shows them: the guide's real quality check as comments on the guide
// (guide-comments.js), or, with none, the made-up issues page.
//
// Where the checks are is kept for the guide in sessionStorage, so it
// survives the page reloading — collapsing or expanding the side nav is a
// form post — and a run in progress carries on where it was.
;(function () {
  const buttons = Array.from(document.querySelectorAll('[data-start-checks]'))
  if (!buttons.length) return

  const { issueCount, qualityCheckHref, issuesHref } = buttons[0].dataset
  const statuses = Array.from(
    document.querySelectorAll('[data-checks-nav-status]')
  )
  const DURATION_SECONDS = 8

  let state = 'idle'
  let realCheckFound = false

  const STORAGE_KEY = `publishing-checks:${window.location.pathname}`

  function remember(saved) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch (e) {}
  }

  function recall() {
    try {
      return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {}
    } catch (e) {
      return {}
    }
  }

  function setStatus(text) {
    statuses.forEach((status) => {
      status.textContent = text
    })
  }

  function setLabel(button, label) {
    button
      .querySelectorAll(
        '.app-side-nav__text, .app-side-nav__rail-label, .app-side-nav__tooltip'
      )
      .forEach((text) => {
        text.textContent = label
      })
  }

  // The number of issues as the nav's lists show theirs: a badge, or the
  // rail's dot (its label then says it).
  function addBadge(button, issues) {
    const inRail = button.classList.contains('app-side-nav__rail-item')
    const badge = document.createElement('span')
    badge.textContent = issues
    if (inRail) {
      badge.className = 'app-side-nav__rail-dot'
      badge.setAttribute('aria-hidden', 'true')
      button.querySelector('.app-side-nav__rail-label').textContent +=
        ` (${issues} issues)`
    } else {
      badge.className = 'app-side-nav__badge'
      const hidden = document.createElement('span')
      hidden.className = 'govuk-visually-hidden'
      hidden.textContent = ' issues'
      badge.appendChild(hidden)
    }
    button.appendChild(badge)
  }

  function lastRunText(isoDate) {
    const when = new Date(isoDate)
    const date = when.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const time = when.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `Last run: ${date} at ${time}`
  }

  function secondsLeft(seconds) {
    return `${seconds} second${seconds === 1 ? '' : 's'} left`
  }

  // The guide's real latest quality check, asked for when the run starts so
  // it is usually back by the time the pretend run ends; null when there is
  // none, and the issue count is made up.
  function fetchRealCheck() {
    if (!qualityCheckHref || !window.fetch) return Promise.resolve(null)
    return window
      .fetch(qualityCheckHref, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  }

  function madeUpIssueCount() {
    const stored = Number(issueCount)
    return Number.isNaN(stored) || stored < 0
      ? Math.floor(Math.random() * 20) + 1
      : stored
  }

  function finish(issues, lastRun) {
    state = 'complete'
    remember({ state, issues, lastRun, realCheckFound })
    buttons.forEach((button) => {
      setLabel(button, 'Show publishing checks')
      button.removeAttribute('aria-disabled')
      addBadge(button, issues)
    })
    setStatus(lastRunText(lastRun))
  }

  // A run that started at startedAt (ms), now or before the page reloaded.
  function run(startedAt) {
    state = 'running'
    remember({ state, startedAt })
    buttons.forEach((button) => {
      setLabel(button, 'Running publishing checks')
      button.setAttribute('aria-disabled', 'true')
    })
    const realCheck = fetchRealCheck()

    const endsAt = startedAt + DURATION_SECONDS * 1000
    const secondsToGo = () =>
      Math.max(Math.ceil((endsAt - Date.now()) / 1000), 0)
    setStatus(secondsLeft(secondsToGo()))
    const tick = window.setInterval(() => {
      setStatus(secondsLeft(secondsToGo()))
    }, 1000)

    window.setTimeout(
      () => {
        window.clearInterval(tick)
        realCheck.then((check) => {
          realCheckFound = Boolean(check)
          if (check) {
            finish(check.issueCount, check.lastRun)
          } else {
            finish(madeUpIssueCount(), new Date().toISOString())
          }
        })
      },
      Math.max(endsAt - Date.now(), 0)
    )
  }

  function showChecks() {
    if (realCheckFound && document.querySelector('[data-guide-comments]')) {
      document.dispatchEvent(new CustomEvent('app:show-guide-comments'))
    } else {
      window.location.href = issuesHref
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (state === 'running') return
      if (state === 'complete') {
        showChecks()
        return
      }
      run(Date.now())
    })
  })

  const saved = recall()
  if (saved.state === 'complete') {
    realCheckFound = Boolean(saved.realCheckFound)
    finish(saved.issues, saved.lastRun)
  }
  if (saved.state === 'running') run(saved.startedAt)
})()
