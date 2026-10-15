//
// The PWA prototype's researcher controls and URLs (see
// app/views/playground/prototype-settings/). Mode A keeps the hub inside the
// installed app; mode B keeps it in a browser tab and launches document
// windows into the app. Session-backed, so a browser tab and the installed
// app (same Chromium profile, same cookie) always agree on the mode.
//

const MODES = {
  a: { text: 'Option A: All-in-PWA', hint: 'The hub runs in the app window' },
  b: {
    text: 'Option B: Split',
    hint: 'The hub runs in a browser tab and opens documents in the app'
  }
}

// How option B gets from a browser tab into the app — which one works is
// what the spike is for (the PWA prototype plan).
const B_LAUNCH = {
  capture: {
    text: 'Link capturing',
    hint: 'A normal link. Only opens the app if "Open supported links" is switched on for it'
  },
  protocol: {
    text: 'Protocol handler',
    hint: 'A web+guidancehub:// link. The browser asks the first time'
  }
}

// Chosen on the sign-in page: the app is the first-class option, the
// browser the fallback for anyone who can't or won't install it.
const OPEN_IN = {
  app: {
    text: 'In the RPA Guidance Hub app',
    hint: 'Each guide opens in its own window. You may be asked to install the app first'
  },
  browser: {
    text: 'In this browser',
    hint: 'Guides open in this tab, like any other website'
  }
}

const DEFAULT_OPEN_IN = 'app'
const DEFAULT_MODE = 'a'
const DEFAULT_B_LAUNCH = 'protocol'
const PROTOCOL = 'web+guidancehub'
const HUB_WINDOW_NAME = 'guidance-hub'

function getMode(req) {
  return MODES[req.session.data.pwaMode]
    ? req.session.data.pwaMode
    : DEFAULT_MODE
}

function setMode(req, value) {
  if (MODES[value]) req.session.data.pwaMode = value
}

function getOpenIn(req) {
  return OPEN_IN[req.session.data.pwaOpenIn]
    ? req.session.data.pwaOpenIn
    : DEFAULT_OPEN_IN
}

function setOpenIn(req, value) {
  if (OPEN_IN[value]) req.session.data.pwaOpenIn = value
}

function getBLaunch(req) {
  return B_LAUNCH[req.session.data.pwaBLaunch]
    ? req.session.data.pwaBLaunch
    : DEFAULT_B_LAUNCH
}

function setBLaunch(req, value) {
  if (B_LAUNCH[value]) req.session.data.pwaBLaunch = value
}

// The out-of-scope door (open-in-browser/routes.js): Chromium opens a URL
// outside the manifest scope from an app window in a browser tab.
function browserDoorHref(path) {
  return `/open-in-browser?to=${encodeURIComponent(path)}`
}

function windowHref(base, id) {
  return `${base}/window/${encodeURIComponent(id)}`
}

// Every link opening a document in the app needs, for the current mode.
// `href` is an optional /guide/ URL (e.g. a resume-reading section) to open
// in the app window instead of the guide's start.
function buildOpenLinks(req, base, id, href) {
  const mode = getMode(req)
  const guideHref = `${base}/guide/${encodeURIComponent(id)}`
  const appHref =
    href && href.startsWith(`${base}/guide/`)
      ? `${base}/window/${href.slice(`${base}/guide/`.length)}`
      : windowHref(base, id)
  const protocolHref = `${PROTOCOL}://guide/${encodeURIComponent(id)}`
  const windowName = `guide-${id}`

  // Where "Open in app" points, and its target, before any JS: option A
  // names the window (so the browser reuses it), option B either relies on
  // link capturing (only captured for links that open a new tab) or hands
  // a protocol link to the OS.
  let launch = { href: appHref, target: windowName }
  if (mode === 'b') {
    launch =
      getBLaunch(req) === 'capture'
        ? { href: appHref, target: '_blank' }
        : { href: protocolHref, target: null }
  }

  return {
    id,
    appHref,
    protocolHref,
    windowName,
    launchHref: launch.href,
    launchTarget: launch.target,
    // Through the out-of-scope door in both modes: from the app (option A)
    // that's what makes it a browser tab, and in option B it stops link
    // capturing pulling the new tab into the app.
    tabHref: browserDoorHref(guideHref)
  }
}

// A guide's one link (its title on the hub): a plain link in the browser
// experience, otherwise the app launch link pwa.js enhances.
function buildGuideLink(req, base, id, href) {
  if (getOpenIn(req) === 'browser') return { href }
  const open = buildOpenLinks(req, base, id, href)
  return {
    href: open.launchHref,
    target: open.launchTarget,
    app: {
      id,
      href: open.appHref,
      windowName: open.windowName
    }
  }
}

// res.locals.pwa, set for every playground page by playground/routes.js.
function buildPwa(req, base) {
  const hubHref = `${base}/hub`
  return {
    openIn: getOpenIn(req),
    mode: getMode(req),
    bLaunch: getBLaunch(req),
    manifestHref: `${base}/manifest.webmanifest`,
    serviceWorkerHref: `${base}/sw.js`,
    scope: `${base}/`,
    hubHref,
    hubDoorHref: browserDoorHref(hubHref),
    hubWindowName: HUB_WINDOW_NAME,
    appHomeHref: `${base}/window`,
    installHref: `${base}/install`,
    settingsHref: `${base}/prototype-settings`
  }
}

module.exports = {
  OPEN_IN,
  MODES,
  B_LAUNCH,
  PROTOCOL,
  getOpenIn,
  setOpenIn,
  getMode,
  setMode,
  getBLaunch,
  setBLaunch,
  browserDoorHref,
  windowHref,
  buildOpenLinks,
  buildGuideLink,
  buildPwa
}
