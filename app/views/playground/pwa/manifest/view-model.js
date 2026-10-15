const { PROTOCOL } = require('../../../../data/pwa')

// The web app manifest, built from the router's mount path so a frozen
// snapshot's copy describes its own pages, not live playground's.
function manifest(base) {
  const icon = (file, size, purpose) => ({
    src: `/public/images/pwa/${file}`,
    sizes: size,
    type: file.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
    purpose
  })

  return {
    id: `${base}/hub`,
    // Chromium puts the app's name in front of every app window's title, so
    // it's what a document window reads as: "RPA Guidance Hub - <guide>".
    name: 'RPA Guidance Hub',
    short_name: 'RPA Guidance Hub',
    description: 'Read RPA guidance, each guide in its own window.',
    start_url: `${base}/hub`,
    scope: `${base}/`,
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: [
      icon('icon-192.png', '192x192', 'any'),
      icon('icon-512.png', '512x512', 'any'),
      icon('icon-maskable-512.png', '512x512', 'maskable'),
      icon('icon.svg', 'any', 'any')
    ],
    // Each launch (a captured link or a protocol link) gets its own window.
    launch_handler: { client_mode: ['navigate-new'] },
    protocol_handlers: [
      { protocol: PROTOCOL, url: `${base}/window/launch?target=%s` }
    ],
    // Lets navigator.getInstalledRelatedApps() see this app from its scope.
    related_applications: [
      { platform: 'webapp', url: `${base}/manifest.webmanifest` }
    ]
  }
}

module.exports = { manifest }
