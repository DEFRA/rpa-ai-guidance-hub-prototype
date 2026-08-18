# rpa-ai-guidance-hub-prototype

A [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) project for Defra (DDTS), running on the Core Delivery Platform. It's a research prototype, not a production service.

## Structure

- `app/routes.js` — all routes, session/journey logic
- `app/views/` — Nunjucks (`.html`/`.njk`) templates, using [GOV.UK Design System](https://design-system.service.gov.uk/) components
- `app/data/prototypes.js` — defines every prototype version and journey; the landing page is generated entirely from this file
- `app/assets/javascripts/quality-checks.js` — shared client+server rules engine (required by `routes.js`, loaded in the browser too)
- `app/config.json` — prototype kit config (e.g. `rebrand` toggle for GOV.UK brand refresh)

## Dev server

Runs on **Node v24** locally, though the GOV.UK Prototype Kit officially supports v16–22 — be alert to compatibility quirks the kit hasn't been tested against on newer Node versions.

## Notes

- Not production code: no resilience, security, or performance guarantees are expected here.
