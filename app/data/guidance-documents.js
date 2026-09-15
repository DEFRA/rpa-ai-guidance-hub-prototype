//
// Full document data for organic-search.html's results, and the two pages a
// result leads to: document-overview.html and saved-document-view.html
// (rendered at /find-guidance/document/:id). One entry per id covers
// everything all three pages need — title, description, version tag, and
// the last updated/published dates — so clicking through from a specific
// result on organic-search.html shows that same document all the way
// through, rather than document-overview.html and saved-document-view.html
// each defaulting to whichever document their own hardcoded data happened
// to have first.
//
// 'higher-tier-stewardship-options', 'countryside-stewardship-capital-grants',
// 'basic-payment-scheme-closing-rules' and 'sfi-soil-health-actions' reuse
// their ids and title/description from app/data/search-results.js — the
// three latter ones are read by find-guidance.html's "Saved guidance" tab
// (app/routes.js), the same way 'higher-tier-stewardship-options' already is
// by organic-search.html, so a row there resolves to the same document
// wherever it is opened from. Every CS MA id, and
// cs-revenue-claims-processing-final-payment-guide, is new — those results
// do not exist in search-results.js at all.
//
// showOnOrganicSearch marks which entries organic-search.html's own results
// list shows (app/routes.js filters on it for that route) — every entry
// currently carries it except 'countryside-stewardship-capital-grants',
// 'basic-payment-scheme-closing-rules' and 'sfi-soil-health-actions', added
// purely for the "Saved guidance" tab above, so adding them here did not
// also change what organic-search.html shows.
//
// versions (document-overview.html's Version dropdown) is additional detail
// alongside, not instead of, the top-level version/lastUpdated/published
// fields above — those three keep driving the Version tag on
// organic-search.html and find-guidance.html exactly as before. Whichever of
// versions.version1/version2 matches the top-level version repeats the same
// lastUpdated/published values (see app/routes.js, which also works out
// which key that is); the other is invented placeholder detail for a version
// that either came before it or has not been published yet, always dated
// earlier/later accordingly so the two stay in a sensible order.
//
// category/scheme/year drive organic-search.html's client-side filtering
// (app/routes.js embeds a slim id/title/description/version/dates/category/
// scheme/year copy of every showOnOrganicSearch entry as JSON for that
// page's own script to filter/sort). category is one of the Category
// filter's three options; scheme mirrors it for a document whose category is
// Countryside Stewardship or Sustainable Farming Incentive (matching one of
// the Scheme filter's two checkboxes) and is left unset otherwise — a
// Cross Compliance document has no scheme checkbox to match, so it simply
// never matches either one, same as ticking a scheme that genuinely does not
// apply to it. year is lastUpdated's year, as a number.
//

const guidanceDocuments = [
  {
    id: 'cs-ma-revenue-options-claim-rule-signoff-2026',
    title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026',
    description: 'Sets out the claim rule checks applied to revenue options at signoff, including how conflicting or overlapping claims are identified and resolved.',
    version: 'Version 1',
    lastUpdated: '20 July 2025',
    published: '3 March 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 July 2025',
        published: '3 March 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '18 September 2025',
        published: '2 September 2025',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    },
    // The only document with its own accurate step content — every other
    // entry in this file is read by saved-document-view.html's generic
    // 3-phase placeholder flow instead (see app/routes.js and the
    // customSteps handling in that template). A body array entry that is
    // itself an array renders as a bulleted list; the literal string
    // 'CASE_NOTE_BLOCK' in the last step renders the fixed case-note
    // template block instead of a paragraph — see saved-document-view.html.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'Introduction',
        heading: 'Introduction',
        body: [
          'There are instances where, when specific option codes and checks are present, no investigation is required, and the case can be closed. If the only options/checks present are:',
          [
            'AB1, AB8 and/or AB15 and the check solely relates to checks being required against the IAPA layer, historic and moorland layers',
            'If the check solely relates to checks being required against historical feature layers e.g. HS5 [SHINE, SAM, Registered Battlefields, Parks and Gardens]',
            'GS1, WD7, WD8, WT1, WT2, HS2, HS3, HS4 and/or HS9 and the check solely relates to checks being required against the Historical layer',
            'LH1 and/or LH2 and the check solely relates to checks being required against the Heathland layer',
            'GS4, WD3, AB3 and/or AB13 and the check solely relates to checks being required against the Historical layer and Moorland'
          ]
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Assign case',
        heading: 'Assign case',
        body: [
          'Is the option being checked AB5 against the Historical layer and Moorland?',
          'If "Yes": cross check the options map (found on CRM) with the HEFER/FER to ensure the option is eligible. If the options map is unavailable, request an updated options map that confirms the AB5 location for the current revenue claim year from the Agreement Holder.',
          'If "No": continue to the next step.'
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'Work the anomaly',
        heading: 'Work the anomaly',
        body: [
          'Have other options been identified that relate to other checks not mentioned above?',
          'If "No", go to section 4.2 Close Case.',
          'If "Yes", continue investigating the anomaly using the relevant checks for those options.'
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'Close case',
        heading: 'Close case',
        body: [
          "Input the following standard case note within the 'CS MA Claim – Revenue Option Claim Rule at Signoff' case, completing the highlighted parts. Once completed, format the note to plain black text.",
          'CASE_NOTE_BLOCK'
        ]
      }
    ]
  },
  {
    id: 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026',
    title: 'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026',
    description: 'Explains what happens when the recorded land use or land cover does not match the requirements of a selected option at the point of signoff, and how to resolve the mismatch.',
    version: 'Version 2',
    lastUpdated: '12 June 2025',
    published: '15 January 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '10 November 2023',
        published: '3 October 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '12 June 2025',
        published: '15 January 2024',
        versionNotes: 'Updated to clarify how land use and land cover mismatches are resolved at signoff.'
      }
    },
    // A body string can contain one or more {{LINK:label text}} markers —
    // see the renderLinkMarkers filter (app/filters.js), applied generically
    // to every body paragraph/bullet in saved-document-view.html, not just
    // this document's. Each marker becomes a non-navigating, govuk-link-styled
    // placeholder for guidance that does not have a real page to link to yet.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'Force Majeure / Obvious Error review',
        heading: '1. Force Majeure / Obvious Error review',
        body: [
          'Where the claimant is wishing to claim less on a parcel/option that is detailed within their agreement this may be because:',
          [
            'The claimant has simply made a mistake when completing their claim form i.e. an Obvious Error, or',
            'The claimant has had to reduce the amount they can claim against due to unforeseen circumstances i.e. Force Majeure.'
          ],
          'Complete a review of CRM to confirm if any correspondence has been received which would explain the reason the claimant wishes to reduce the amount being claimed on, refer to the guide {{LINK:CRM Advanced Find}}.',
          'Was claimant correspondence identified?',
          [
            "If 'No' continue to section 2.2 Land checks to investigate.",
            "If 'Yes' investigate the correspondence provided by the claimant, refer to either:"
          ],
          [
            '{{LINK:Aide for dealing with Force Majeure requests guidance}}',
            '{{LINK:Obvious Error guidance}}'
          ],
          'Continue to section 2.2 Land checks to investigate.'
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Land checks - check types',
        heading: '2. Land checks to investigate',
        body: [
          "The type of check you need to investigate is shown within the 'Description' box as follows:",
          [
            'Options Compatibility.',
            'Land Use Compatibility.',
            'Land Use to Land Cover Compatibility.'
          ]
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'Land checks - closing BE3 cases',
        heading: 'Notes box guidance',
        body: [
          "The 'Notes' box offers background around the case trigger and options that require investigation, as follows:",
          "If the only option code present is BE3 you can close the 'CS MA Claim – Land Use or Land Cover not compatible with Options at Signoff' case with the following standard case note, completing the parts in red. Once completed format note to black text and close the case, for guidance refer to the SITI Agri Basic Navigation Guide section 15 'Close a case'."
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'Supplement options warning',
        heading: 'Important note on supplement options',
        body: [
          'Note: Case management warnings may only include base options. You must cross check for any supplement options that are in the Agreement and include these when closing cases. For example, an option can sit (be located) by itself on a parcel, however a supplement requires a [content incomplete — placeholder text, to be finished].'
        ]
      }
    ]
  },
  {
    id: 'cs-ma-agreement-level-options-not-verified-2026',
    title: 'CS MA Claim - Agreement Level Options not Verified 2026',
    description: 'Covers the verification checks for agreement-level options, including what evidence is required before an option can be confirmed as verified.',
    version: 'Version 1',
    lastUpdated: '2 May 2025',
    published: '9 November 2023',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '2 May 2025',
        published: '9 November 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '14 July 2025',
        published: '30 June 2025',
        versionNotes: 'Clarified evidence requirements for agreement-level verification checks.'
      }
    }
  },
  {
    id: 'cs-ma-claim-refresh-signoff-check-2026',
    title: 'CS MA Claim - Claim Refresh Signoff Check 2026',
    description: 'Describes the checks run when a claim is refreshed ahead of signoff, including how updated data is reconciled against the original claim.',
    version: 'Version 2',
    lastUpdated: '28 April 2025',
    published: '1 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 November 2024',
        published: '12 September 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '28 April 2025',
        published: '1 February 2025',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-evidence-required-2026',
    title: 'CS MA - Evidence Required',
    description: "Sets out what supporting evidence is needed before a CS MA claim can proceed, and how to request it from the claimant if it's missing.",
    version: 'Version 2',
    lastUpdated: '18 August 2026',
    published: '22 April 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '10 March 2025',
        published: '2 January 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '18 August 2026',
        published: '22 April 2025',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026',
    title: 'CS MA - Parcel not Under Control of SBI at Signoff 2026',
    description: "Explains the checks required when a claimed parcel is not recorded as under the control of the claimant's SBI at the point of signoff, and how to resolve the discrepancy.",
    version: 'Version 1',
    lastUpdated: '3 July 2026',
    published: '11 December 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 July 2026',
        published: '11 December 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '20 September 2026',
        published: '5 September 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-ab12-op3-maximum-eligible-weight-2026',
    title: 'CS MA Claim - AB12 or OP3 Maximum Eligible Weight 2026',
    description: 'Covers the maximum eligible weight checks applied to AB12 and OP3 options, including how to identify and correct claims that exceed the eligible threshold.',
    version: 'Version 2',
    lastUpdated: '27 May 2026',
    published: '6 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 November 2024',
        published: '3 October 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '27 May 2026',
        published: '6 February 2025',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-existing-2026',
    title: 'CS MA Claim - Existing 2026',
    description: 'Guidance on handling claims linked to an existing agreement, including how to verify continuity of options and options carried over from the previous scheme year.',
    version: 'Version 1',
    lastUpdated: '9 April 2026',
    published: '19 September 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '9 April 2026',
        published: '19 September 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '30 June 2026',
        published: '15 June 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    // Added, along with the nine CS MA entries below it, purely so
    // organic-search.html (v5) has enough results (20+) to actually show
    // its pagination component — see app/views/versions/v5/organic-search.html
    // and _app-organic-search.scss. showOnOrganicSearch: true on all ten,
    // same as every other CS MA entry above.
    id: 'cs-ma-claim-duplicate-option-code-check-2026',
    title: 'CS MA Claim - Duplicate Option Code Check 2026',
    description: 'Sets out how to identify and resolve cases where the same option code has been claimed more than once within a single agreement year.',
    version: 'Version 1',
    lastUpdated: '12 August 2026',
    published: '18 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '12 August 2026',
        published: '18 February 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '30 September 2026',
        published: '10 September 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-ineligible-land-cover-type-2026',
    title: 'CS MA Claim - Ineligible Land Cover Type 2026',
    description: "Explains the checks applied when a claimed parcel's land cover type does not match the eligibility requirements for the selected option.",
    version: 'Version 2',
    lastUpdated: '22 July 2026',
    published: '5 October 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '15 August 2024',
        published: '3 June 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '22 July 2026',
        published: '5 October 2024',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-late-claim-submission-rule-2026',
    title: 'CS MA Claim - Late Claim Submission Rule 2026',
    description: 'Covers how claims submitted after the deadline are flagged, and the checks required before a late submission can be accepted.',
    version: 'Version 1',
    lastUpdated: '3 June 2026',
    published: '14 January 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 June 2026',
        published: '14 January 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '20 August 2026',
        published: '5 August 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-missing-supporting-evidence-2026',
    title: 'CS MA - Missing Supporting Evidence 2026',
    description: 'Details the process for requesting missing supporting evidence from a claimant before a claim can progress to signoff.',
    version: 'Version 2',
    lastUpdated: '29 May 2026',
    published: '9 March 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 January 2025',
        published: '2 December 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '29 May 2026',
        published: '9 March 2025',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-cross-agreement-boundary-overlap-2026',
    title: 'CS MA Claim - Cross Agreement Boundary Overlap 2026',
    description: 'Explains how to investigate and resolve cases where claimed parcels overlap with a boundary from a different agreement.',
    version: 'Version 1',
    lastUpdated: '16 April 2026',
    published: '27 November 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '16 April 2026',
        published: '27 November 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '10 July 2026',
        published: '22 June 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-historic-environment-feature-check-2026',
    title: 'CS MA Claim - Historic Environment Feature Check 2026',
    description: 'Sets out the checks required when a claimed option is located near a recorded historic environment feature.',
    version: 'Version 2',
    lastUpdated: '8 March 2026',
    published: '20 August 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '5 July 2024',
        published: '14 May 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '8 March 2026',
        published: '20 August 2024',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-option-stacking-compatibility-2026',
    title: 'CS MA Claim - Option Stacking Compatibility 2026',
    description: 'Covers the compatibility rules for stacking multiple options on the same parcel, and how to identify conflicting combinations.',
    version: 'Version 1',
    lastUpdated: '19 February 2026',
    published: '2 July 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '19 February 2026',
        published: '2 July 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '25 May 2026',
        published: '9 May 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-withdrawn-claim-reinstatement-2026',
    title: 'CS MA - Withdrawn Claim Reinstatement 2026',
    description: 'Explains the process for reinstating a previously withdrawn claim where the claimant has provided a valid reason.',
    version: 'Version 2',
    lastUpdated: '11 January 2026',
    published: '30 September 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 August 2024',
        published: '3 July 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '11 January 2026',
        published: '30 September 2024',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-payment-rate-recalculation-2026',
    title: 'CS MA Claim - Payment Rate Recalculation 2026',
    description: "Sets out when a claim's payment rate must be recalculated following a change in scheme rates or claimed area.",
    version: 'Version 1',
    lastUpdated: '24 December 2025',
    published: '16 May 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '24 December 2025',
        published: '16 May 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '15 March 2026',
        published: '27 February 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-agreement-holder-change-notification-2026',
    title: 'CS MA Claim - Agreement Holder Change Notification 2026',
    description: 'Covers the checks required when a change of agreement holder is notified partway through a claim year.',
    version: 'Version 2',
    lastUpdated: '5 November 2025',
    published: '12 April 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 February 2024',
        published: '10 January 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '5 November 2025',
        published: '12 April 2024',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'higher-tier-stewardship-options',
    title: 'Higher Tier stewardship options',
    description: 'An overview of the options available under a Higher Tier Countryside Stewardship agreement and how they differ from Mid Tier.',
    version: 'Version 1',
    lastUpdated: '14 March 2025',
    published: '20 August 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '14 March 2025',
        published: '20 August 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '22 May 2025',
        published: '5 May 2025',
        versionNotes: 'Clarified eligibility criteria for land with high environmental value.'
      }
    }
  },
  {
    id: 'countryside-stewardship-capital-grants',
    title: 'Countryside Stewardship: capital grants',
    description: 'Explains the capital items available under Countryside Stewardship, including fencing and hedgerow restoration, and how to apply for a grant.',
    version: 'Version 1',
    lastUpdated: '12 August 2026',
    published: '4 February 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '12 August 2026',
        published: '4 February 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '3 October 2026',
        published: '20 September 2026',
        versionNotes: 'Updated capital item payment rates and clarified fencing specification requirements.'
      }
    }
  },
  {
    id: 'basic-payment-scheme-closing-rules',
    title: 'Basic Payment Scheme: closing rules',
    description: 'Sets out what still applies to farmers with BPS entitlements or open legacy claims now the scheme has closed to new claims.',
    version: 'Version 2',
    lastUpdated: '5 August 2026',
    published: '11 September 2023',
    // No scheme — BPS is neither Countryside Stewardship nor Sustainable
    // Farming Incentive, and the Scheme filter has no third checkbox for
    // Cross Compliance, so this document simply never matches either one.
    category: 'Cross Compliance',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '19 June 2023',
        published: '2 May 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '5 August 2026',
        published: '11 September 2023',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'sfi-soil-health-actions',
    title: 'Sustainable Farming Incentive: soil health actions',
    description: 'Explains the soil health actions available under SFI 23, what evidence to keep, and how they interact with other actions on the same land.',
    version: 'Version 1',
    lastUpdated: '3 July 2026',
    published: '22 April 2024',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 July 2026',
        published: '22 April 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '29 August 2026',
        published: '14 August 2026',
        versionNotes: 'Clarified soil testing evidence requirements and updated payment rates.'
      }
    }
  },
  {
    // Added for the "Awaiting approval" tab on the v5-only Manage guidance
    // page (app/views/versions/v5/all-guidance-docs.html) — that row named
    // "Hedgerow management standards" existed only in app/data/documents.js
    // (a different, older placeholder file used by that page's own
    // Publishing checks/Changes requested counts), which has no version
    // field at all, so there was nothing real to look up a version tag
    // from. No showOnOrganicSearch — same as
    // countryside-stewardship-capital-grants/basic-payment-scheme-closing-rules/
    // sfi-soil-health-actions alongside it, kept out of organic-search.html
    // (v2 and v5 alike) so this addition stays invisible there too, not
    // just on the v1 snapshot.
    id: 'hedgerow-management-standards',
    title: 'Hedgerow management standards',
    description: 'Covers cutting dates, buffer strips and record keeping for hedgerows under cross compliance and SFI actions.',
    version: 'Version 1',
    lastUpdated: '20 July 2026',
    published: '15 March 2024',
    category: 'Cross Compliance',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 July 2026',
        published: '15 March 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '2 October 2026',
        published: '18 September 2026',
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-revenue-claims-processing-final-payment-guide',
    title: 'CS Revenue Claims Processing to Final Payment Guide',
    description: "This guide covers the SITI Agri processing of Domestic CS Revenue Payment Claims (Higher Tier and Mid-Tier CS schemes) to be able to make a 'Final Payment'.",
    version: 'Version 1',
    lastUpdated: '28 August 2026',
    published: '28 August 2026',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    showOnOrganicSearch: true,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '28 August 2026',
        published: '28 August 2026',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '28 August 2026',
        published: '28 August 2026',
        versionNotes: 'Placeholder for future revision.'
      }
    },
    // Second document (after cs-ma-revenue-options-claim-rule-signoff-2026)
    // with its own accurate step content, driven by the same generic
    // customSteps/customParts handling in app/routes.js and
    // saved-document-view.html — no template changes needed for a document
    // shaped like this one, just this entry.
    //
    // Nested "sections > parts" format: each top-level section (still what
    // the sidebar shows and groups by) now holds a "parts" array of smaller
    // sub-steps, each with its own partName/heading/body — see app/routes.js
    // for how these get flattened into a single sequential Back/Next flow.
    // The case-types table (in section 4's "Case types to work through"
    // part) is condensed into a bulleted list, since the step-content
    // renderer only supports paragraphs and bullet lists, not tables.
    // Screenshots from the source document are omitted; this is text-only.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'Introduction',
        parts: [
          {
            partName: 'Introduction',
            heading: 'Introduction',
            body: [
              "This guide covers the SITI Agri processing of Domestic CS Revenue Payment Claims (Higher Tier and Mid-Tier CS schemes) to be able to make a 'Final Payment'.",
              "This guide should be followed where the claim is at 'In correction' status and is going to transition straight to 'Signoff Check'.",
              "A claim can be 'Rejected' or 'Withdrawn' at any time in the process, provided no payment has been made. Details on when a rejection or withdrawal may be appropriate are covered in the guide {{LINK:Reject or withdraw a CS Revenue claim}}."
            ]
          },
          {
            partName: 'Working restrictions',
            heading: 'Working restrictions',
            body: [
              "Note: You cannot work a CS Revenue Final Payment claim if there is an open Transfer case with one of the following case types: CS – Transfer Notification Received, CS – Transferor Amendment Created, CS – Transferee Amendment Created. Ask your Team Leader to mark the SBI as 'unworkable'. No further action can be taken on the claim until the Transfer case has been closed.",
              "You will not be able to work the CS Revenue Final Payment claim if there is an open 'CS Agreement - Early Closure' case for the claim year you are working. Ask your team leader to mark the SBI as 'unworkable' and follow the {{LINK:Early Closure Guide}} for further steps.",
              'If you identify an issue when working through the guidance that cannot be resolved by immediate colleagues or your Line Manager, refer to the {{LINK:Issue Resolution Route Guide}} for next steps.'
            ]
          },
          {
            partName: 'Claimed amounts',
            heading: 'Claimed amounts',
            body: [
              "The claim payment process is based upon what the claimant has 'Declared' on their revenue claim. Do not change on their behalf.",
              "If there is a reason/issue that means that we cannot pay for what has been claimed (for example due to incompatibility, absence, or ineligibility), then this must be considered as a breach. The reduction is applied at the 'In checking' stage of the claim process.",
              'If you need to apply either an over delivery, overstated, eligibility or over declaration reduction, details are provided within the {{LINK:CS Revenue Claim - Reductions Guide and How to Apply Them}}.',
              "If you need to apply a 'prescription breach' reduction, details are provided within the {{LINK:CS Breaches and Reductions under Control for claims}} guide."
            ]
          }
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Transitions',
        parts: [
          {
            partName: 'Received to In checking',
            heading: 'Received to In checking',
            body: ["Upon completion of Data Alignment activity, claims are bulk transitioned from 'Received' to 'In checking'."]
          },
          {
            partName: 'Auto-population of claim data',
            heading: 'Auto-population of claim data',
            body: [
              "Upon certain transitions, the system auto populates the claim form questions 'in the positive' so that this manual activity is no longer required. The claim progresses unless there are any 'blocking' non-closed cases in Case Management or system action is required.",
              "Auto population of a claim's verified values with declared values happens on the transition from 'Received' to 'In checking'. This populates the 'Y'/'N' radio button with a 'Y'."
            ]
          },
          {
            partName: 'In checking to Ready for sign off',
            heading: 'In checking to Ready for sign off',
            body: ["A bulk transition attempts to move claims from 'In checking' to 'Ready for sign off' allowing the scheme rules to run. Where these rules fail, case managements may be generated for investigation, and the claim status is set at 'In correction'."]
          },
          {
            partName: 'In correction to Ready for sign off',
            heading: 'In correction to Ready for sign off',
            body: ["Once all case activity is complete, the claim transition from 'In correction' to 'Ready for sign off' can be attempted, allowing the claim to be paid."]
          }
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'Case Creation Principles',
        parts: [
          {
            partName: 'Overview',
            heading: 'Case Creation Principles',
            body: [
              'To ensure consistent and effective handling of customer contact, all CRM cases must now follow a streamlined approach. This replaces the previous method of creating one case per claim per scheme year, which often remained open after payment.',
              'Now, each case will represent a single, distinct issue requiring customer contact. This allows for clearer tracking, faster resolution, and improved customer service.',
              'Any case you create will remain under your ownership as part of the <CS Claim Revenue> Queue. Follow up contact with the customer will require using child cases.'
            ]
          },
          {
            partName: 'Creating a New Case',
            heading: 'Creating a New Case',
            body: [
              "To create a 'New Case', you must first navigate to the customer's Organisation account screen. You can access this from the dashboard by searching for the business using their SBI number — enter an SBI or Organisation name in the search box and press Enter.",
              "You can view open cases from the 'Recent Cases' section within the Organisation account. As the sub grid only shows cases from the last year, to view a list of all cases click the three dots, then click 'See associated records'.",
              'Is there a resolved case present relating to the query?',
              [
                "If 'Yes', continue to the Child Cases part of this guidance.",
                "If 'No', continue to create a new case."
              ],
              "From the ribbon at the top of the page click '+New Case'. Complete all mandatory fields marked with a red asterisk that have not been auto populated, including 'CASE MAPPING' > 'Scheme' (select CS), then the 'Subject' field once it appears.",
              "Under 'CASE DETAILS', enter the Case Title in the format [SBI][Title][Relevant Scheme Year][Agreement reference/Claim ID], for example: 12345678 ED1 Evidence Required 2024 2000000. Also complete 'Case Origin' and 'Case Description'.",
              "Under 'ORGANISATION DETAILS', 'Organisation' should auto populate. Under 'CONTACT DETAILS', enter the contact's name — the rest of the contact information (Email, Mobile Phone, etc.) will auto populate.",
              "Click 'Save'. If a 'Business Process Error' message appears, check you have the correct Scheme and Subject combination and try again. If saved successfully, continue to Resolving the Case."
            ]
          },
          {
            partName: 'Resolving the Case',
            heading: 'Resolving the Case',
            body: [
              "When a customer's queries have been answered, cases should be resolved. Cases with no open activities should also be resolved.",
              "To resolve the case, from the top banner click 'Resolve Case'. Complete the required fields marked with a red asterisk: select a Resolution Type from the drop-down list, enter a summary in Resolution, then click Save & Close.",
              "Note: All activities within a case must be closed before you can resolve it — you'll receive a warning if you attempt to close a case with open activities. Any auto-notification activity can be closed; all other activities should be investigated first."
            ]
          },
          {
            partName: 'Child Cases',
            heading: 'Child Cases',
            body: [
              'If a case has been resolved but follow-up communication with the customer is required, open the resolved case in CRM from the Recent Cases tab and click the Create Child Case icon.',
              'Use the previous case title and add that this is a follow-up, for example: 12345678 ED1 Evidence Required Follow-up 01 2024 2000000, then Follow-up 02 for a second follow-up, and so on.',
              'For further guidance on Child Cases, see the section on creating a Parent-Child relationship (linking cases) in the {{LINK:CRM Basic Functions Guidance}}.'
            ]
          }
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'Case Management',
        parts: [
          {
            partName: 'Early closure cases',
            heading: 'Early closure cases',
            body: [
              'Note: Early closure cases need to be worked for the claim year you are working. Use the {{LINK:Early Closure Guide}} to assist you.',
              "An open 'CS agreement early closure' case with the same scheme year as the claim you are working will cause the transition to sign off to fail, regardless of whether it relates to that particular agreement or not. Check the case notes, details, and correspondence on CRM to determine which agreement ID the closure relates to.",
              'If the early closure case IS relevant to the agreement of the claim you are working, follow the {{LINK:Early Closure Guide}}. The claim for the current claim year will need to be withdrawn before payment is made, as closure processing recovers any completed payments made on the agreement anyway.',
              "If the early closure case is NOT relevant to the agreement of the claim you are working: put the early closure case management to 'Pending for approval' status, move the unaffected claim to sign off, then immediately click the 'red hand' icon to set the case status back to in progress and replace any hold if one was in place.",
              "You may also encounter a claim failing the open cases check due to a 'CS agreement – final closure' case — these only relate to capital-only agreements and are not relevant to revenue claims. Use the same process as above."
            ]
          },
          {
            partName: 'Preparing to transition',
            heading: 'Preparing to transition',
            body: [
              "All holds must be resolved prior to the claim being transitioned. Before continuing, search CRM for any correspondence that may impact the CS claim and help complete any case managements raised — refer to section 2.1 'Accessing CRM' of the {{LINK:CRM Basic Navigation and Admin}} guide.",
              "After attempting to transition to 'Ready for sign off', if the system changes the claim to 'In correction', you will need to transition the claim once more to open and complete the screen. In the transition drop-down, click RE-VERIFICATION, then the footprint icon, then 'Move'.",
              "Note: Before working through the case managements below, check for a 'Suspected Customer Fraud' or 'Fraud Referral under review' case. If found, refer to the {{LINK:Suspected Fraud Cases guide}} for the checks required."
            ]
          },
          {
            partName: 'Case types to work through',
            heading: 'Case types to work through',
            body: [
              'The cases below are separated into subcategories shown in a recommended working order, to help avoid duplicate work or issues appearing in later cases. There is no specific order to work through cases within the same subgroup:',
              [
                'CS Agreement - Early Closure — continue to the Early Closure Guide.',
                "CS Agreement Parcel may have been amended — bulk closure case; close with note: 'Bulk closure case, closed as per Processing to Final Payment Guidance instruction.' If status changes to 'Pending for approval', notify your Team Leader for case closure.",
                'CS Agreement Parcel has been amended',
                'CS Claim Agreement Amendment in progress',
                "CS Transfer Notification Received — put all Revenue cases you're working 'on hold' in SITI Agri. Add a case note starting with 'HOLD711 – Transfer in progress'.",
                'CS Transferor Amendment Created',
                'CS Transferee Amendment Created',
                "BUSINESS STRUCTURE IACS26/27 – PAYMENT HELD — raised by the CCM team during a business change assessment; won't stop the claim transitioning but holds payment. The CCM team closes these cases.",
                'CS Revenue Payment Claim - Amendment in Progress — worked and closed by the amendments team.',
                'CS Revenue Payment Claim - Agreement Amendment Required Following Final Claim Payment — for future year impacted claims.',
                'CS Commons - Parcel Addition to the Common Agreement — continue to the CS Commons - Parcel Addition to the Commons Agreement guide.'
              ],
              "Once you see the 'End of Process' text in the sub-guide you're working, return to this point to work any outstanding cases, or continue to Check verification."
            ]
          }
        ]
      }
    ]
  }
]

module.exports = { guidanceDocuments }
