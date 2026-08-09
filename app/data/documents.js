//
// Guidance documents in the hub.
//
// There is deliberately no cohort and no running total. A designer migrates a
// document when they want to, in whatever order suits them — nothing here
// counts how many are left or hands them the next one.
//
// Status is the whole workflow the designer can see:
//
//   Draft              converted, being worked on, only visible in the hub
//   Awaiting approval  sent to an owner, who approves and publishes it
//   Published          live
//
// A designer never moves a document to Published themselves. That happens in
// the owner journey, which is not designed yet.
//
// `pages` and `issues` are here to keep the pages honest about scale — real
// documents run from 10 to 100 pages, and the quality checks find a lot in the
// long ones.
//

const documents = [
  { name: 'Applying for the Sustainable Farming Incentive', pages: 84, issues: 31, status: 'Draft' },
  { name: 'Countryside Stewardship: capital grants', pages: 96, issues: 0, status: 'Awaiting approval' },
  { name: 'How inspections work', pages: 42, issues: 12, status: 'Draft' },
  { name: 'Payment deadlines and what to expect', pages: 18, issues: 0, status: 'Published' },
  { name: 'Cross compliance rules', pages: 71, issues: 22, status: 'Draft' },
  { name: 'Hedgerow management standards', pages: 24, issues: 0, status: 'Published' },
  { name: 'Soil testing and nutrient management', pages: 38, issues: 0, status: 'Awaiting approval' },
  { name: 'Woodland creation: eligibility', pages: 55, issues: 14, status: 'Draft' }
]

// The documents in one upload, for the option where several are sent at once.
// An ad hoc selection the designer happened to pick up — not a defined set.
const batch = [
  { name: 'Moorland and upland options', pages: 63, issues: 19 },
  { name: 'Water quality and buffer strips', pages: 29, issues: 8 },
  { name: 'Basic Payment Scheme: closing rules', pages: 100, issues: 34 },
  { name: 'Appeals and complaints', pages: 12, issues: 1 },
  { name: 'Slurry storage requirements', pages: 31, issues: 7 },
  { name: 'Record keeping and evidence', pages: 20, issues: 0 }
]

// The document the issues pages, the findings and the editor all work on. Its
// markdown is app/data/sample-document.js, so the title has to match.
const current = {
  name: 'Check an application for the Sustainable Farming Incentive',
  pages: 34,
  status: 'Draft'
}

// A file the virus check would not accept. CDP Uploader scans every upload and
// can reject one outright (DEFRA/cdp-uploader, "rejected file (virus)
// callback"), so this is a real outcome rather than an invented edge case. It
// never reaches the hub, so it is not part of `batch`.
const rejected = {
  name: 'Payment deadlines and what to expect.docx',
  reason: 'The virus check found a problem with this file'
}

module.exports = {
  documents,
  batch,
  current,
  rejected,
  batchPages: batch.reduce((total, document) => total + document.pages, 0),
  batchIssues: batch.reduce((total, document) => total + document.issues, 0),
  batchWithIssues: batch.filter((document) => document.issues > 0).length
}
