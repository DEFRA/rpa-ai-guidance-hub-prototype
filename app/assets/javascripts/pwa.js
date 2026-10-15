// The PWA prototype's client side (see app/data/pwa.js): service worker
// registration, the install prompt, one-window-per-document opening and
// focusing, the document window's Hub link, and the prototype settings
// page's diagnostics. Everything here enhances plain links that already
// work without JavaScript.
;(function () {
  var configElement = document.getElementById('app-pwa-config')
  if (!configElement) return
  var config = JSON.parse(configElement.textContent)

  var CHANNEL_NAME = 'guidance-hub-pwa'
  var PING_TIMEOUT = 150
  var channel =
    'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null
  var installPrompt = null
  var docId = config.docId || null
  var isAppHome = Boolean(config.appHome)

  // Where the installed app should be instead of this page, or null.
  function appRedirectHref() {
    if (!isStandalone()) return null
    var path = window.location.pathname
    // Option B keeps the hub in the browser, so the installed app landing
    // anywhere but a document window (or the researcher settings) goes to
    // the app home instead, e.g. when it's launched from the Start menu.
    if (
      config.mode === 'b' &&
      !docId &&
      !isAppHome &&
      path.indexOf(config.settingsHref) !== 0
    ) {
      return config.appHomeHref
    }
    // The install screen is only for browser tabs: the app goes to the hub.
    if (path.indexOf(config.installHref) === 0) return config.hubHref
    return null
  }

  var redirectHref = appRedirectHref()
  if (redirectHref) {
    window.location.replace(redirectHref)
    return
  }

  // Installing from the prompt moves this tab into the new app window
  // without reloading it, so check again once it's become the app.
  var standaloneQuery = window.matchMedia('(display-mode: standalone)')
  function onDisplayModeChange() {
    var href = appRedirectHref()
    if (href) window.location.replace(href)
    else updateInstallUi()
  }
  if (standaloneQuery.addEventListener) {
    standaloneQuery.addEventListener('change', onDisplayModeChange)
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
  }

  function log(message) {
    var output = document.querySelector('[data-pwa-log]')
    if (output) {
      output.textContent +=
        new Date().toLocaleTimeString() + '  ' + message + '\n'
    }
    if (window.console) console.log('[pwa] ' + message)
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(config.serviceWorkerHref, { scope: config.scope })
      .catch(function (error) {
        log('Service worker failed to register: ' + error)
      })
  }

  // --- Install -----------------------------------------------------------

  function updateInstallUi() {
    var status = document.querySelectorAll('[data-pwa-install-status]')
    var buttons = document.querySelectorAll('[data-pwa-install]')
    var text = isStandalone()
      ? 'You are using the installed app.'
      : installPrompt
        ? 'The app is not installed. You can install it with the button below.'
        : config.mode === 'a'
          ? 'If RPA Guidance Hub is already installed, open it from the Start menu and use the hub there. Otherwise, install it from the browser menu.'
          : 'The browser has not offered to install the app. It may already be installed, or you may need to use the browser menu.'
    status.forEach(function (element) {
      element.textContent = text
    })
    buttons.forEach(function (button) {
      button.hidden = !installPrompt
    })
    // A way out of the install screen if the app ever lands on it.
    document
      .querySelectorAll('[data-pwa-standalone-only]')
      .forEach(function (element) {
        element.hidden = !isStandalone()
      })
    // Option B's hub install panel (option A's hub never shows in a tab).
    var needsInstall = !isStandalone() && Boolean(installPrompt)
    document
      .querySelectorAll('[data-pwa-install-panel]')
      .forEach(function (panel) {
        panel.hidden = !needsInstall
      })
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault()
    installPrompt = event
    log('beforeinstallprompt fired')
    updateInstallUi()
  })

  window.addEventListener('appinstalled', function () {
    installPrompt = null
    log('appinstalled fired')
    updateInstallUi()
  })

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-pwa-install]')
    if (!button || !installPrompt) return
    installPrompt.prompt()
    installPrompt.userChoice.then(function (choice) {
      log('Install prompt: ' + choice.outcome)
      installPrompt = null
      updateInstallUi()
    })
  })

  // --- Windows -----------------------------------------------------------

  // Every window that isn't a document window is a hub window, named so a
  // document window's Hub link can target it.
  if (!docId && !isAppHome) window.name = config.hubWindowName

  // A document window answers "is guide X open?" pings from the hub.
  if (channel) {
    channel.addEventListener('message', function (event) {
      var data = event.data || {}
      if (docId && data.type === 'ping' && data.id === docId) {
        channel.postMessage({ type: 'pong', id: docId })
      }
    })
  }

  function isDocumentOpen(id) {
    return new Promise(function (resolve) {
      if (!channel) return resolve(false)
      var timer = setTimeout(done, PING_TIMEOUT, false)
      function done(open) {
        clearTimeout(timer)
        channel.removeEventListener('message', onMessage)
        resolve(open)
      }
      function onMessage(event) {
        var data = event.data || {}
        if (data.type === 'pong' && data.id === id) done(true)
      }
      channel.addEventListener('message', onMessage)
      channel.postMessage({ type: 'ping', id: id })
    })
  }

  // Brings an open document's window forward rather than reloading it; an
  // empty URL gets a named window without navigating it. Only finds windows
  // this one's group opened, so a window launched another way (a captured
  // link or protocol link) may get a duplicate.
  function openInAppWindow(id, href, name) {
    return isDocumentOpen(id).then(function (open) {
      var win
      if (open) {
        win = window.open('', name)
        if (win && win.location.href === 'about:blank') {
          win.location.replace(href)
          log(
            id +
              ': open elsewhere, but not reachable by name, so opened a new window'
          )
        } else if (win) {
          win.focus()
          log(id + ': already open, focused it')
        }
      } else {
        win = window.open(href, name)
        log(id + ': opened ' + (win ? 'a window' : 'nothing (blocked?)'))
      }
      return win
    })
  }

  window.appPwa = {
    config: config,
    isStandalone: isStandalone,
    openInAppWindow: openInAppWindow,
    log: log
  }

  // The document window's Hub link (option A only): focuses the hub window
  // where it can.
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-pwa-hub-link]')
    if (!link || config.mode !== 'a') return
    event.preventDefault()
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus()
        log('Hub: focused the opener')
        return
      } catch (error) {
        log('Hub: could not focus the opener: ' + error)
      }
    }
    window.open(link.href, config.hubWindowName)
    log(
      'Hub: opened ' +
        link.href +
        ' in the window named ' +
        config.hubWindowName
    )
  })

  // --- Guide links (hub results) -----------------------------------------

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-pwa-open-app]')
    if (!link) return
    var id = link.getAttribute('data-doc-id')

    if (config.mode === 'a') {
      // Option A's hub only runs in the app, so this is always an app window.
      event.preventDefault()
      openInAppWindow(
        id,
        link.getAttribute('data-app-href'),
        link.getAttribute('data-window-name')
      )
    } else if (installPrompt) {
      // Option B: the browser only offers to install an app that isn't
      // installed, so point at the install panel rather than a dead link.
      event.preventDefault()
      var panel = document.querySelector('[data-pwa-install-panel]')
      if (panel) panel.focus()
    } else {
      log(id + ': option B launch via ' + config.bLaunch)
    }
  })

  // --- Diagnostics (prototype settings page) -----------------------------

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-diag]')
    if (!button) return
    var kind = button.getAttribute('data-diag')
    var href = button.getAttribute('data-href')
    var name = button.getAttribute('data-name')

    if (kind === 'open-named') {
      var win = window.open(href, name)
      log(
        'window.open(' +
          href +
          ', ' +
          name +
          ') returned ' +
          (win ? 'a window' : 'null')
      )
    } else if (kind === 'open-reuse') {
      openInAppWindow(name.replace(/^guide-/, ''), href, name)
    } else if (kind === 'report') {
      report()
    }
  })

  function report() {
    log('display-mode standalone: ' + isStandalone())
    log('window.name: ' + (window.name || '(none)'))
    log('opener: ' + (window.opener ? 'yes' : 'no'))
    log('mode: ' + config.mode + ', option B launch: ' + config.bLaunch)
    log('beforeinstallprompt captured: ' + Boolean(installPrompt))
    log('user agent: ' + navigator.userAgent)
    if (navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then(
        function (apps) {
          log('getInstalledRelatedApps: ' + JSON.stringify(apps))
        },
        function (error) {
          log('getInstalledRelatedApps failed: ' + error)
        }
      )
    } else {
      log('getInstalledRelatedApps: not supported')
    }
  }

  document.addEventListener('DOMContentLoaded', updateInstallUi)
  updateInstallUi()
})()
