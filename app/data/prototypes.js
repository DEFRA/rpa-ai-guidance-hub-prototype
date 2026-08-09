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
// `status` is one of: current, superseded, archived.
//

module.exports = {
  versions: [
    {
      id: 'v1',
      name: 'Version 1',
      status: 'current',
      date: '8 August 2026',
      summary:
        'First pass at the designer journey. Documents run from 10 to 100 pages, so every page is sized for that. The two options are alternative approaches to migrating, tested against no fixed order and no set list of documents to get through.',
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
            { name: 'Sign in', path: '/designer/sign-in' },
            { name: 'Landing page', path: '/designer/dashboard' },
            {
              name: 'Upload a Word document',
              path: '/designer/migrate/single/upload',
              startsBranch: true
            },
            {
              name: 'Checking your file',
              path: '/designer/migrate/single/uploading'
            },
            {
              name: 'Check the document',
              path: '/designer/migrate/single/check'
            },
            {
              name: 'Document migrated',
              path: '/designer/migrate/single/confirmation'
            },
            { name: 'Quality issues', path: '/designer/documents/issues' }
          ],
          alternatives: [
            {
              name: 'File rejected by the virus check',
              path: '/designer/migrate/single/rejected'
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
            { name: 'Sign in', path: '/designer/sign-in' },
            { name: 'Landing page', path: '/designer/dashboard' },
            {
              name: 'Upload your Word documents',
              path: '/designer/migrate/multiple/upload',
              startsBranch: true
            },
            {
              name: 'Checking your files',
              path: '/designer/migrate/multiple/uploading'
            },
            {
              name: 'Documents you have added',
              path: '/designer/migrate/multiple/documents'
            },
            {
              name: 'Check your documents',
              path: '/designer/migrate/multiple/check'
            },
            {
              name: 'Conversion started',
              path: '/designer/migrate/multiple/confirmation'
            },
            {
              name: 'Converted documents',
              path: '/designer/migrate/multiple/queue'
            },
            { name: 'Quality issues', path: '/designer/documents/issues' }
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
            { name: 'Sign in', path: '/designer/sign-in' },
            { name: 'Landing page', path: '/designer/dashboard' },
            { name: 'Your documents', path: '/designer/documents' },
            { name: 'Quality issues', path: '/designer/documents/issues' },
            {
              name: 'Fix them in the editor',
              path: '/designer/documents/edit',
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
            { name: 'Sign in', path: '/designer/sign-in' },
            { name: 'Landing page', path: '/designer/dashboard' },
            { name: 'Your documents', path: '/designer/documents' },
            { name: 'Quality issues', path: '/designer/documents/issues' },
            {
              name: 'A finding',
              path: '/designer/documents/findings',
              startsBranch: true,
              route: true
            },
            {
              name: 'Review complete',
              path: '/designer/documents/review-complete'
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
            { name: 'Sign in', path: '/designer/sign-in' },
            { name: 'Landing page', path: '/designer/dashboard' },
            {
              name: 'Your documents',
              path: '/designer/documents',
              startsBranch: true
            },
            { name: 'Edit a document', path: '/designer/documents/edit' }
          ],
          alternatives: [
            {
              name: 'Preview the document in a new tab',
              path: '/designer/documents/preview'
            }
          ]
        }
      ]
    }
  ]
}
