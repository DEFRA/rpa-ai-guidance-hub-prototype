//
// Feature flags read once at startup, from environment variables — a
// deployment-time on/off switch, not a session-backed choice like role or
// the context pane's collapsed state (app/data/context-pane.js): which
// dataset a whole environment reads guidance from isn't something a
// researcher should be able to flip mid-session the way those are.
//

// Switches app/data/guidance-documents/index.js between today's baked-in
// dataset and the real API-backed one — see app/lib/guidance-api-loader.js,
// which reads the Prototype guides API (docs/prototype-guides-api.md) at
// GUIDANCE_API_BASE_URL below.
const GUIDANCE_API_ENABLED = process.env.GUIDANCE_API_ENABLED === 'true'

// Base URL of the Prototype guides API (see
// app/lib/guidance-api-client.js). Defaults to the local dev port the API
// runs on so GUIDANCE_API_ENABLED works out of the box locally without
// also having to set this.
const GUIDANCE_API_BASE_URL =
  process.env.GUIDANCE_API_BASE_URL || 'http://localhost:8085'

// The playground overlays API guides on the mock ones whenever the API is
// configured, by base URL alone; GUIDANCE_API_ENABLED keeps its meaning for
// the frozen snapshots, which swap rather than overlay.
const GUIDANCE_API_CONFIGURED =
  GUIDANCE_API_ENABLED || Boolean(process.env.GUIDANCE_API_BASE_URL)

// Set MOCK_GUIDES_ENABLED=false to hide the mock guides from the playground's
// hub and side nav, leaving only the API's guides. On unless turned off.
const MOCK_GUIDES_ENABLED = process.env.MOCK_GUIDES_ENABLED !== 'false'

module.exports = {
  MOCK_GUIDES_ENABLED,
  GUIDANCE_API_ENABLED,
  GUIDANCE_API_CONFIGURED,
  GUIDANCE_API_BASE_URL
}
