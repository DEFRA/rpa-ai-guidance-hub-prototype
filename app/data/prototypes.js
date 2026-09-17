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
      // Frozen record only — no journeys, since app/views/versions/v1/**
      // duplicates v2's pages exactly as they were and none of its routes
      // read this file (see app/lib/prototypes.js's findStep, which only
      // ever matches unprefixed/legacy paths).
      id: 'v1',
      name: 'Version 1',
      status: 'superseded',
      date: null,
      entryHref: '/v1/',
      summary: 'Initial guidance document management and find/locate journey.',
      changes: [],
      journeys: []
    },
    {
      // This entry's journeys/steps were previously labelled "v1" even
      // though every step path is unprefixed (/designer/...), which only
      // ever matched the live pages now namespaced under /v2/ — never the
      // frozen /v1/ snapshot. Renamed to v2 and step paths re-prefixed
      // below to match; content (summary/changes) is otherwise unchanged.
      id: 'v2',
      name: 'Version 2',
      status: 'archived',
      date: '8 August 2026',
      entryHref: '/v2/sign-in',
      // The one-line blurb shown on the versions list at "/" — kept as the
      // original hand-written text from when that page was static HTML.
      // `changes` below is this version's own fuller build history, not
      // currently rendered anywhere.
      summary:
        'Guidance document management and find/locate journey. Frozen — superseded by Version 5.',
      changes: [
        'Added sign in and the designer landing page',
        'Built the two migration approaches as alternatives, to decide between them in research',
        'Limited uploads to Word documents',
        'Quality checks report issues after migrating instead of blocking it',
        'Added a markdown editor, shared by both approaches and the edit branch, where issues are fixed',
        'Sized the editor for 10 to 100 page documents: issue locations, a jump-to-section control, and checks that clear as they are fixed',
        'A designer takes documents in any order — no cohort, no running total, no prescribed next document',
        'A converted document becomes a draft, and only an owner can approve and publish it',
        'Quality issues are summarised on their own page before the editor opens, following the Single Front Door fix pattern',
        'The editor borrows the GOV.UK publishing toolbar, and shows markdown and preview side by side with synchronised scrolling so the section being edited stays visible in a long document',
        'The preview can be opened in its own tab, carrying unsaved changes with it',
        'Uploads are scanned before they are accepted, following the CDP Uploader model Single Front Door uses, with a rejected-file outcome',
        'Quality checks now come from the authoring requirements, so every finding carries its rule ID and a severity',
        'Two ways to work through the findings, to compare in research: fix them in the editor, or step through them one at a time recording a verdict on each'
      ],
      journeys: [
        {
          id: 'designer-migrate-single',
          persona: 'Designer',
          name: 'Migrate documents',
          variant: 'Option A — one document at a time',
          branch: 'migrate',
          description:
            'A designer converts a single Word document, then fixes what the quality checks found before sending it for approval.',
          steps: [
            { name: 'Sign in', path: '/v2/designer/sign-in' },
            { name: 'Landing page', path: '/v2/designer/dashboard' },
            {
              name: 'Upload a Word document',
              path: '/v2/designer/migrate/single/upload',
              startsBranch: true
            },
            {
              name: 'Checking your file',
              path: '/v2/designer/migrate/single/uploading'
            },
            {
              name: 'Check the document',
              path: '/v2/designer/migrate/single/check'
            },
            {
              name: 'Document migrated',
              path: '/v2/designer/migrate/single/confirmation'
            },
            { name: 'Quality issues', path: '/v2/designer/documents/issues' }
          ],
          alternatives: [
            {
              name: 'File rejected by the virus check',
              path: '/v2/designer/migrate/single/rejected'
            }
          ]
        },
        {
          id: 'designer-migrate-multiple',
          persona: 'Designer',
          name: 'Migrate documents',
          variant: 'Option B — several documents at once',
          branch: 'migrate',
          description:
            'The designer converts several Word documents in one go, then picks which of the converted drafts to work on from what the quality checks found.',
          steps: [
            { name: 'Sign in', path: '/v2/designer/sign-in' },
            { name: 'Landing page', path: '/v2/designer/dashboard' },
            {
              name: 'Upload your Word documents',
              path: '/v2/designer/migrate/multiple/upload',
              startsBranch: true
            },
            {
              name: 'Checking your files',
              path: '/v2/designer/migrate/multiple/uploading'
            },
            {
              name: 'Documents you have added',
              path: '/v2/designer/migrate/multiple/documents'
            },
            {
              name: 'Check your documents',
              path: '/v2/designer/migrate/multiple/check'
            },
            {
              name: 'Conversion started',
              path: '/v2/designer/migrate/multiple/confirmation'
            },
            {
              name: 'Converted documents',
              path: '/v2/designer/migrate/multiple/queue'
            },
            { name: 'Quality issues', path: '/v2/designer/documents/issues' }
          ]
        },
        {
          id: 'designer-fix-editor',
          persona: 'Designer',
          name: 'Fix quality issues',
          variant: 'Option A — fix them in the editor',
          branch: 'fix',
          description:
            'The designer opens the whole document and fixes what they choose, in whatever order. Findings are places to go to; nothing is recorded against them.',
          steps: [
            { name: 'Sign in', path: '/v2/designer/sign-in' },
            { name: 'Landing page', path: '/v2/designer/dashboard' },
            { name: 'Your documents', path: '/v2/designer/documents' },
            { name: 'Quality issues', path: '/v2/designer/documents/issues' },
            {
              name: 'Fix them in the editor',
              path: '/v2/designer/documents/edit',
              startsBranch: true
            }
          ]
        },
        {
          id: 'designer-fix-step-through',
          persona: 'Designer',
          name: 'Fix quality issues',
          variant: 'Option B — step through them one at a time',
          branch: 'fix',
          description:
            'The designer takes one finding at a time and records a verdict on each — fixed, false positive or will not fix — until none are left.',
          steps: [
            { name: 'Sign in', path: '/v2/designer/sign-in' },
            { name: 'Landing page', path: '/v2/designer/dashboard' },
            { name: 'Your documents', path: '/v2/designer/documents' },
            { name: 'Quality issues', path: '/v2/designer/documents/issues' },
            {
              name: 'A finding',
              path: '/v2/designer/documents/findings',
              startsBranch: true,
              route: true
            },
            {
              name: 'Review complete',
              path: '/v2/designer/documents/review-complete'
            }
          ]
        },
        {
          id: 'designer-edit',
          persona: 'Designer',
          name: 'Edit existing documents',
          branch: 'edit',
          description:
            'The other route off the landing page, into the same markdown editor the migrate branch uses to fix issues.',
          steps: [
            { name: 'Sign in', path: '/v2/designer/sign-in' },
            { name: 'Landing page', path: '/v2/designer/dashboard' },
            {
              name: 'Your documents',
              path: '/v2/designer/documents',
              startsBranch: true
            },
            { name: 'Edit a document', path: '/v2/designer/documents/edit' }
          ],
          alternatives: [
            {
              name: 'Preview the document in a new tab',
              path: '/v2/designer/documents/preview'
            }
          ]
        }
      ]
    },
    // v3/v4/v5 don't drive a step-by-step journey banner on any of their own
    // pages (only v2's designer/* journeys above do), so there's no value in
    // modeling their ~40 pages as steps just to power this list — these are
    // list-only entries.
    {
      id: 'v3',
      name: 'Version 3',
      status: 'superseded',
      date: null,
      entryHref: '/v3/',
      summary:
        'Single sign-in entry, then one full-width landing page combining search, collapsible filters and recent work.',
      changes: [],
      journeys: []
    },
    {
      id: 'v4',
      name: 'Version 4',
      status: 'superseded',
      date: null,
      entryHref: '/v4/upload-guide',
      summary:
        "A simple guidance upload journey: upload, add the guide's details, check and convert, then view the converted guidance. No quality checks for now.",
      changes: [],
      journeys: []
    },
    {
      id: 'v5',
      name: 'Version 5',
      status: 'archived',
      date: null,
      entryHref: '/v5/sign-in',
      summary:
        'Homepage split between finding guidance and managing all guidance documents. Frozen — superseded by Version 6.',
      changes: [],
      journeys: []
    },
    {
      // A duplicate of Version 5's own main flow (sign-in, start, find
      // guidance, manage guidance, editor-experiment), the same treatment
      // Version 5 got from Version 2 — see app/views/v6/'s route modules
      // and app/views/versions/v6/ for exactly what that covers.
      id: 'v6',
      name: 'Version 6',
      status: 'current',
      date: null,
      entryHref: '/v6/sign-in',
      summary:
        'Homepage split between finding guidance and managing all guidance documents.',
      changes: [],
      journeys: []
    }
  ]
}
