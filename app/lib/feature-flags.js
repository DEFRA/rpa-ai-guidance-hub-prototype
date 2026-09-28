//
// Feature flags read once at startup, from environment variables — a
// deployment-time on/off switch, not a session-backed choice like role or
// the context pane's collapsed state (app/data/context-pane.js): which
// dataset a whole environment reads guidance from isn't something a
// researcher should be able to flip mid-session the way those are.
//

// Switches app/data/guidance-documents/index.js between today's baked-in
// dataset and the real API-backed one (currently a stub — see
// app/lib/guidance-api-loader.js — since no endpoint, auth or Markdown
// renderer exist in this prototype yet).
const GUIDANCE_API_ENABLED = process.env.GUIDANCE_API_ENABLED === 'true'

module.exports = { GUIDANCE_API_ENABLED }
