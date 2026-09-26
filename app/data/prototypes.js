//
// Prototype versions and journey breakdowns.
//
// The landing page at / is generated entirely from this file — adding a version,
// a journey or a step here is all that is needed for it to appear.
//
// Convention: a step's `path` maps to a view file, so `/designer/sign-in` lives
// at `app/views/designer/sign-in.html`. The landing page checks the filesystem,
// so steps you have planned but not built yet are tagged rather than linked to
// a 404.
//
// Keeping old versions in their own folder means a round of research stays
// intact and comparable instead of being overwritten by the next iteration.
//
// Journey fields:
//   persona      groups journeys on the index
//   branch       journeys that share a starting point but diverge (migrate, edit)
//   variant      label shown when two journeys are alternative designs of the
//                same thing, to be compared in research
//   steps[].route  served by app/routes.js rather than a view file, so the
//                 index does not tag it as not built
//   alternatives  outcomes that are not part of the main sequence — a rejected
//                 file, an error — listed under the steps rather than numbered
//                 among them, so the step count stays honest
//   steps[].startsBranch
//                the first step that is unique to this branch — shared pages
//                like the dashboard link here, following whichever variant the
//                participant was started on
//
// `status` is one of: current, superseded, archived. The versions list at "/"
// (app/views/index.html) only shows a "(current)"/"(archived)" suffix for
// those two statuses — "superseded" versions are shown plain, matching what
// the page already looked like before it read from this file.
//
// `entryHref` is the link target for the version's tile on that page.
//

module.exports = {
  versions: [
    {
      // Not another numbered version — a reset of the versioning strategy
      // itself. Pulls the one canonical page for each step of the journey
      // out of v1–v6 (rather than adding a v7 with its own parallel
      // duplicates) into app/views/playground/, following a live crawl
      // and gap analysis rather than the original research brief's
      // assumed journey.
      //
      // This is the live, incrementally-evolving build — the one place
      // ongoing/mob prototyping happens. When a state of it needs to be
      // preserved for a research session, `npm run snapshot` freezes a copy
      // into its own entry below (see CLAUDE.md and scripts/snapshot.js).
      id: 'playground',
      name: 'Playground',
      status: 'current',
      date: '24 September 2026',
      entryHref: '/playground/',
      summary:
        'The live prototype, built from the best page of each prior version and evolved incrementally from here — frozen into a snapshot before each research session.',
      changes: [],
      journeys: []
    }

    // Snapshots below this line are appended by scripts/snapshot.js — do not
    // hand-edit. Run `npm run snapshot` to add one.
  ]
}
